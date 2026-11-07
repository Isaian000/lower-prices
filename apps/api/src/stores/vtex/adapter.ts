import type { Offer, SearchSort, Store } from "@lower-prices/shared";

import type { StoreAdapter, StoreSearchParams, StoreSearchResult } from "../types.js";
import { mapVtexProduct } from "./map.js";
import { vtexProductSchema } from "./schema.js";

export interface VtexStoreConfig extends Store {
  /** Origen de la tienda, p. ej. "https://www.chedraui.com.mx". */
  baseUrl: string;
}

export interface VtexAdapterDeps {
  fetch?: typeof fetch;
  now?: () => Date;
}

/** VTEX limita cada petición a 50 resultados y la paginación a los primeros 2,500. */
const MAX_PAGE = 50;
const MAX_FROM = 2500;

const SORT_PARAM: Record<SearchSort, string | undefined> = {
  relevance: undefined,
  price_asc: "OrderByPriceASC",
  price_desc: "OrderByPriceDESC",
};

export class VtexError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VtexError";
  }
}

/**
 * Deja solo letras, números, espacios y - . , / % & _ en la búsqueda.
 * El firewall de VTEX responde 400 con comillas, paréntesis, "+", "<" o ">".
 */
export function sanitizeVtexQuery(query: string): string {
  return query
    .replace(/[^\p{L}\p{N}\s\-.,/%&_]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildVtexSearchUrl(baseUrl: string, params: StoreSearchParams): URL {
  const from = params.offset;
  const to = from + Math.min(params.limit, MAX_PAGE) - 1;

  const query: [string, string][] = [
    ["ft", sanitizeVtexQuery(params.query)],
    ["_from", String(from)],
    ["_to", String(to)],
  ];

  const sort = SORT_PARAM[params.sort];
  if (sort) query.push(["O", sort]);

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const min = params.minPrice ?? 0;
    const max = params.maxPrice ?? 999_999_999;
    query.push(["fq", `P:[${min} TO ${max}]`]);
  }

  // No se usa URLSearchParams porque codifica el espacio como "+", y el firewall
  // de VTEX lo rechaza con 400 ("Scripts are not allowed"). Con %20 sí responde.
  const search = query.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
  return new URL(`/api/catalog_system/pub/products/search?${search}`, baseUrl);
}

/** Lee el total de la cabecera `resources: 0-9/60`. */
export function parseResourcesTotal(header: string | null): number | undefined {
  const match = header?.match(/\/(\d+)\s*$/);
  return match?.[1] ? Number(match[1]) : undefined;
}

/**
 * Adaptador genérico para tiendas VTEX (API pública de catálogo).
 * La misma implementación sirve para cualquier tienda: solo cambia `baseUrl`.
 */
export function createVtexAdapter(
  config: VtexStoreConfig,
  deps: VtexAdapterDeps = {},
): StoreAdapter {
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? (() => new Date());
  const { baseUrl, ...store } = config;

  async function search(params: StoreSearchParams): Promise<StoreSearchResult> {
    if (params.offset >= MAX_FROM || !sanitizeVtexQuery(params.query)) {
      return { offers: [], total: 0 };
    }

    const url = buildVtexSearchUrl(baseUrl, params);
    const response = await doFetch(url, {
      headers: { Accept: "application/json", "User-Agent": "lower-prices/0.1" },
      signal: params.signal ?? null,
    });

    // VTEX responde 206 (Partial Content) cuando hay más resultados.
    if (response.status !== 200 && response.status !== 206) {
      throw new VtexError(`${store.id} respondió ${response.status}`, response.status);
    }

    const body: unknown = await response.json().catch(() => undefined);
    if (!Array.isArray(body)) throw new VtexError(`${store.id} devolvió un formato inesperado`);

    const fetchedAt = now().toISOString();
    const offers: Offer[] = [];
    for (const raw of body) {
      // Un producto con datos raros no debe tumbar toda la búsqueda.
      const parsed = vtexProductSchema.safeParse(raw);
      if (!parsed.success) continue;
      const offer = mapVtexProduct(parsed.data, store, fetchedAt);
      if (offer) offers.push(offer);
    }

    const total =
      parseResourcesTotal(response.headers.get("resources")) ?? params.offset + body.length;
    return { offers, total: Math.min(total, MAX_FROM) };
  }

  return { store, allowedHosts: [new URL(baseUrl).hostname], search };
}
