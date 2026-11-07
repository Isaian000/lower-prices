import type { MatchedBy, Offer, ProductGroup } from "@lower-prices/shared";

import { compactKey } from "../lib/product.js";
import { diceSimilarity, titleTokens } from "./normalize-title.js";

/** Oferta con su posición en los resultados de su tienda (0 = más relevante). */
export interface RankedOffer {
  offer: Offer;
  rank: number;
}

export interface RankedGroup {
  group: ProductGroup;
  /** Mejor posición entre sus ofertas; sirve para ordenar por relevancia. */
  rank: number;
}

export interface GroupOptions {
  /** Similitud mínima de títulos para el nivel 3. */
  titleThreshold?: number;
  /** Fracción de la mediana bajo la cual un precio se considera atípico. */
  outlierRatio?: number;
}

const DEFAULTS = { titleThreshold: 0.8, outlierRatio: 0.4 } as const;

/** De más a menos confiable. */
const TIER_ORDER: readonly MatchedBy[] = ["gtin", "model", "title", "single"];

function weakest(a: MatchedBy, b: MatchedBy): MatchedBy {
  if (a === "single") return b;
  if (b === "single") return a;
  return TIER_ORDER.indexOf(a) > TIER_ORDER.indexOf(b) ? a : b;
}

interface Node {
  entry: RankedOffer;
  gtin?: string | undefined;
  brandKey?: string | undefined;
  modelKey?: string | undefined;
  tokens: Set<string>;
}

interface Component {
  stores: Set<string>;
  gtins: Set<string>;
  models: Set<string>;
  matchedBy: MatchedBy;
}

function toNode(entry: RankedOffer): Node {
  const ids = entry.offer.identifiers;
  return {
    entry,
    gtin: ids?.gtin,
    brandKey: ids?.brand ? compactKey(ids.brand) : undefined,
    modelKey: ids?.model ? compactKey(ids.model) : undefined,
    tokens: titleTokens(entry.offer.title),
  };
}

/** true si a es mejor oferta que b: con stock antes que agotada, luego más barata. */
function isBetterOffer(a: Offer, b: Offer): boolean {
  if (a.available !== b.available) return a.available;
  return a.price < b.price;
}

/**
 * Junta las publicaciones repetidas de una misma tienda (mismo GTIN, p. ej. varios
 * vendedores de marketplace) y deja la mejor. Conserva la mejor posición.
 */
function dedupeWithinStore(entries: readonly RankedOffer[]): RankedOffer[] {
  const byKey = new Map<string, RankedOffer>();
  const result: RankedOffer[] = [];

  for (const entry of entries) {
    const gtin = entry.offer.identifiers?.gtin;
    if (!gtin) {
      result.push(entry);
      continue;
    }
    const key = `${entry.offer.store.id}|${gtin}`;
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, entry);
      continue;
    }
    const best = isBetterOffer(entry.offer, current.offer) ? entry.offer : current.offer;
    byKey.set(key, { offer: best, rank: Math.min(entry.rank, current.rank) });
  }
  return [...result, ...byKey.values()];
}

class UnionFind {
  private readonly parent: number[];
  readonly components: Component[];

  constructor(nodes: readonly Node[]) {
    this.parent = nodes.map((_, index) => index);
    this.components = nodes.map((node) => ({
      stores: new Set([node.entry.offer.store.id]),
      gtins: new Set(node.gtin ? [node.gtin] : []),
      models: new Set(node.modelKey ? [node.modelKey] : []),
      matchedBy: "single",
    }));
  }

  find(index: number): number {
    let root = index;
    while (this.parent[root] !== root) root = this.parent[root]!;
    this.parent[index] = root;
    return root;
  }

  component(index: number): Component {
    return this.components[this.find(index)]!;
  }

  union(a: number, b: number, tier: MatchedBy): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;

    const target = this.components[rootA]!;
    const source = this.components[rootB]!;
    for (const store of source.stores) target.stores.add(store);
    for (const gtin of source.gtins) target.gtins.add(gtin);
    for (const model of source.models) target.models.add(model);
    target.matchedBy = weakest(weakest(target.matchedBy, source.matchedBy), tier);
    this.parent[rootB] = rootA;
  }
}

function disjoint<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  for (const value of a) if (b.has(value)) return false;
  return true;
}

/** Dos conjuntos no vacíos sin elementos en común = identificadores en conflicto. */
function conflicts<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  return a.size > 0 && b.size > 0 && disjoint(a, b);
}

/**
 * Para los niveles 2 y 3 se exige que los grupos no compartan tienda (dos
 * publicaciones de la misma tienda suelen ser variantes distintas) y que no
 * tengan GTIN distintos (p. ej. el mismo audífono en otro color).
 */
function canMergeLoosely(uf: UnionFind, a: number, b: number): boolean {
  const ca = uf.component(a);
  const cb = uf.component(b);
  return disjoint(ca.stores, cb.stores) && !conflicts(ca.gtins, cb.gtins);
}

function median(values: readonly number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function buildGroup(members: readonly Node[], matchedBy: MatchedBy): RankedGroup {
  const byRank = members.toSorted((a, b) => a.entry.rank - b.entry.rank);
  const lead = byRank[0]!.entry.offer;
  const offers = members
    .map((node) => node.entry.offer)
    .toSorted((a, b) => (a.available !== b.available ? (a.available ? -1 : 1) : a.price - b.price));

  // El rango de precios se calcula con las ofertas con stock, si las hay.
  const priced = offers.some((offer) => offer.available)
    ? offers.filter((offer) => offer.available)
    : offers;
  const prices = priced.map((offer) => offer.price);

  const gtin = byRank.find((node) => node.gtin)?.gtin;
  const withModel = byRank.find((node) => node.brandKey && node.modelKey);
  const id = gtin
    ? `gtin:${gtin}`
    : withModel
      ? `model:${withModel.brandKey}-${withModel.modelKey}`
      : `offer:${byRank[0]!.entry.offer.id}`;

  const brand = byRank.find((node) => node.entry.offer.identifiers?.brand)?.entry.offer.identifiers
    ?.brand;
  const model = byRank.find((node) => node.entry.offer.identifiers?.model)?.entry.offer.identifiers
    ?.model;
  const imageUrl = byRank.find((node) => node.entry.offer.imageUrl)?.entry.offer.imageUrl;

  return {
    rank: byRank[0]!.entry.rank,
    group: {
      id,
      title: lead.title,
      ...(brand ? { brand } : {}),
      ...(model ? { model } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      offerCount: offers.length,
      matchedBy: offers.length > 1 ? matchedBy : "single",
      offers,
    },
  };
}

/**
 * Agrupa ofertas de distintas tiendas que corresponden al mismo producto.
 * Niveles (README, "Agrupación de productos"):
 *   1. GTIN idéntico.
 *   2. Marca + modelo normalizados idénticos.
 *   3. Títulos parecidos (Dice ≥ umbral) con marca compatible.
 * Después saca de cada grupo las ofertas con precio atípico (p. ej. una funda
 * agrupada con el teléfono), salvo en los grupos por GTIN.
 */
export function groupOffers(
  entries: readonly RankedOffer[],
  options: GroupOptions = {},
): RankedGroup[] {
  const { titleThreshold, outlierRatio } = { ...DEFAULTS, ...options };
  const nodes = dedupeWithinStore(entries).map(toNode);
  const uf = new UnionFind(nodes);

  // Nivel 1: GTIN.
  const byGtin = new Map<string, number>();
  nodes.forEach((node, index) => {
    if (!node.gtin) return;
    const first = byGtin.get(node.gtin);
    if (first === undefined) byGtin.set(node.gtin, index);
    else uf.union(first, index, "gtin");
  });

  // Nivel 2: marca + modelo.
  const byModel = new Map<string, number[]>();
  nodes.forEach((node, index) => {
    if (!node.brandKey || !node.modelKey) return;
    const key = `${node.brandKey}|${node.modelKey}`;
    byModel.set(key, [...(byModel.get(key) ?? []), index]);
  });
  for (const indexes of byModel.values()) {
    for (let i = 0; i < indexes.length; i++) {
      for (let j = i + 1; j < indexes.length; j++) {
        const a = indexes[i]!;
        const b = indexes[j]!;
        if (uf.find(a) !== uf.find(b) && canMergeLoosely(uf, a, b)) uf.union(a, b, "model");
      }
    }
  }

  // Nivel 3: similitud de títulos. Primero se unen los pares más parecidos.
  const candidates: { a: number; b: number; score: number }[] = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const na = nodes[a]!;
      const nb = nodes[b]!;
      if (na.entry.offer.store.id === nb.entry.offer.store.id) continue;
      if (na.brandKey && nb.brandKey && na.brandKey !== nb.brandKey) continue;
      const score = diceSimilarity(na.tokens, nb.tokens);
      if (score >= titleThreshold) candidates.push({ a, b, score });
    }
  }
  candidates.sort((x, y) => y.score - x.score);
  for (const { a, b } of candidates) {
    if (uf.find(a) === uf.find(b)) continue;
    const ca = uf.component(a);
    const cb = uf.component(b);
    if (conflicts(ca.models, cb.models)) continue;
    if (canMergeLoosely(uf, a, b)) uf.union(a, b, "title");
  }

  // Armar los grupos y quitar precios atípicos.
  const members = new Map<number, Node[]>();
  nodes.forEach((node, index) => {
    const root = uf.find(index);
    members.set(root, [...(members.get(root) ?? []), node]);
  });

  const groups: RankedGroup[] = [];
  for (const [root, list] of members) {
    const { matchedBy } = uf.components[root]!;
    if (list.length < 2 || matchedBy === "gtin") {
      groups.push(buildGroup(list, matchedBy));
      continue;
    }
    const limit = median(list.map((node) => node.entry.offer.price)) * outlierRatio;
    const kept = list.filter((node) => node.entry.offer.price >= limit);
    const outliers = list.filter((node) => node.entry.offer.price < limit);
    if (kept.length > 0) groups.push(buildGroup(kept, matchedBy));
    for (const node of outliers) groups.push(buildGroup([node], "single"));
  }
  return withUniqueIds(groups);
}

/** Dos grupos pueden compartir id (p. ej. mismo modelo en dos publicaciones de una tienda). */
function withUniqueIds(groups: RankedGroup[]): RankedGroup[] {
  const seen = new Map<string, number>();
  return groups.map((entry) => {
    const count = seen.get(entry.group.id) ?? 0;
    seen.set(entry.group.id, count + 1);
    if (count === 0) return entry;
    return { ...entry, group: { ...entry.group, id: `${entry.group.id}~${count + 1}` } };
  });
}
