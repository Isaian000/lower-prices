import type { SearchResponse, SearchSort, StoreStatus } from "@lower-prices/shared";
import type { Logger } from "pino";

import type { Cache } from "../cache/types.js";
import { type OutboundRule, withOutboundUrls } from "../lib/outbound.js";
import type { StoreAdapter, StoreSearchParams, StoreSearchResult } from "../stores/types.js";
import { type CircuitBreaker, createCircuitBreaker } from "./circuit-breaker.js";
import { decodeCursor, encodeCursor, type StoreOffsets } from "./cursor.js";
import { groupOffers, type RankedGroup, type RankedOffer } from "./group.js";

export interface SearchRequest {
  query: string;
  cursor?: string | undefined;
  sort: SearchSort;
  /** Ids de tiendas a consultar; vacío o ausente = todas. */
  stores?: readonly string[] | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
}

export interface SearchServiceOptions {
  adapters: readonly StoreAdapter[];
  cache: Cache;
  timeoutMs: number;
  pageSize: number;
  cacheTtlSeconds: number;
  /** Pausa automática por tienda. Por defecto: 3 fallas seguidas → 60 s de pausa. */
  circuitBreaker?: CircuitBreaker;
  /** Reglas de enlace de salida (afiliados). Por defecto, las de lib/outbound.ts. */
  outboundRules?: Readonly<Record<string, OutboundRule>>;
  logger?: Pick<Logger, "warn" | "debug">;
  now?: () => Date;
}

export class AllStoresFailedError extends Error {
  constructor(readonly stores: StoreStatus[]) {
    super("Ninguna tienda respondió");
    this.name = "AllStoresFailedError";
  }
}

interface StoreOutcome {
  status: StoreStatus;
  offset: number;
  result?: StoreSearchResult;
}

/** Misma búsqueda escrita distinto ("  TV  Samsung") comparte caché. */
export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-MX");
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

function sortGroups(groups: RankedGroup[], sort: SearchSort): RankedGroup[] {
  switch (sort) {
    case "price_asc":
      return groups.toSorted((a, b) => a.group.lowestPrice - b.group.lowestPrice);
    case "price_desc":
      return groups.toSorted((a, b) => b.group.lowestPrice - a.group.lowestPrice);
    case "relevance":
      // Mejor posición primero; a igual posición, el que está en más tiendas.
      return groups.toSorted((a, b) => a.rank - b.rank || b.group.offerCount - a.group.offerCount);
  }
}

export function createSearchService(options: SearchServiceOptions) {
  const { adapters, cache, timeoutMs, pageSize, cacheTtlSeconds, logger } = options;
  const now = options.now ?? (() => new Date());
  const adapterById = new Map(adapters.map((adapter) => [adapter.store.id, adapter]));
  const breaker =
    options.circuitBreaker ?? createCircuitBreaker({ threshold: 3, cooldownMs: 60_000 });
  /** Consultas en curso por clave: dos búsquedas iguales simultáneas comparten una sola. */
  const inflight = new Map<string, Promise<StoreOutcome>>();

  async function readCache(key: string): Promise<StoreSearchResult | undefined> {
    try {
      return await cache.get<StoreSearchResult>(key);
    } catch (error) {
      logger?.warn({ err: error }, "No se pudo leer la caché");
      return undefined;
    }
  }

  function writeCache(key: string, value: StoreSearchResult): void {
    cache.set(key, value, cacheTtlSeconds).catch((error: unknown) => {
      logger?.warn({ err: error }, "No se pudo escribir en la caché");
    });
  }

  function cacheKey(id: string, params: Omit<StoreSearchParams, "signal">): string {
    return [
      "search:v1",
      id,
      normalizeQuery(params.query),
      params.offset,
      params.limit,
      params.sort,
      params.minPrice ?? "",
      params.maxPrice ?? "",
    ].join("|");
  }

  function searchStore(
    adapter: StoreAdapter,
    params: Omit<StoreSearchParams, "signal">,
  ): Promise<StoreOutcome> {
    const key = cacheKey(adapter.store.id, params);
    const running = inflight.get(key);
    if (running) return running;

    const promise = fetchStore(adapter, params, key).finally(() => inflight.delete(key));
    inflight.set(key, promise);
    return promise;
  }

  async function fetchStore(
    adapter: StoreAdapter,
    params: Omit<StoreSearchParams, "signal">,
    key: string,
  ): Promise<StoreOutcome> {
    const id = adapter.store.id;
    const started = performance.now();
    const elapsed = () => Math.round(performance.now() - started);

    const cached = await readCache(key);
    if (cached) {
      return {
        offset: params.offset,
        result: cached,
        status: { id, status: "ok", count: cached.offers.length, durationMs: elapsed() },
      };
    }

    // La caché se revisa antes: una tienda en pausa aún puede servir resultados guardados.
    if (breaker.isPaused(id)) {
      return {
        offset: params.offset,
        status: { id, status: "paused", count: 0, durationMs: elapsed() },
      };
    }

    try {
      const result = await adapter.search({ ...params, signal: AbortSignal.timeout(timeoutMs) });
      breaker.recordSuccess(id);
      writeCache(key, result);
      return {
        offset: params.offset,
        result,
        status: { id, status: "ok", count: result.offers.length, durationMs: elapsed() },
      };
    } catch (error) {
      const timedOut = isTimeout(error);
      breaker.recordFailure(id);
      logger?.warn(
        { err: error, store: id },
        timedOut ? "Tienda sin respuesta a tiempo" : "Falló la tienda",
      );
      return {
        offset: params.offset,
        status: { id, status: timedOut ? "timeout" : "error", count: 0, durationMs: elapsed() },
      };
    }
  }

  /** Qué tiendas consultar y desde qué posición. */
  function plan(request: SearchRequest): [StoreAdapter, number][] {
    const allowed = request.stores?.length ? new Set(request.stores) : undefined;
    const offsets: StoreOffsets = request.cursor
      ? decodeCursor(request.cursor)
      : Object.fromEntries(adapters.map((adapter) => [adapter.store.id, 0]));

    return Object.entries(offsets).flatMap(([id, offset]): [StoreAdapter, number][] => {
      const adapter = adapterById.get(id);
      if (!adapter || (allowed && !allowed.has(id))) return [];
      return [[adapter, offset]];
    });
  }

  async function search(request: SearchRequest): Promise<SearchResponse> {
    const targets = plan(request);
    const outcomes = await Promise.all(
      targets.map(([adapter, offset]) =>
        searchStore(adapter, {
          query: request.query,
          offset,
          limit: pageSize,
          sort: request.sort,
          minPrice: request.minPrice,
          maxPrice: request.maxPrice,
        }),
      ),
    );

    const statuses = outcomes.map((outcome) => outcome.status);
    if (targets.length > 0 && outcomes.every((outcome) => !outcome.result)) {
      throw new AllStoresFailedError(statuses);
    }

    // La posición global (offset + índice) permite intercalar tiendas por relevancia.
    // Los enlaces se procesan después de la caché, para que un cambio en las reglas
    // de afiliados aplique de inmediato.
    const ranked: RankedOffer[] = outcomes.flatMap(({ result, offset }, i) =>
      withOutboundUrls(
        result?.offers ?? [],
        targets[i]![0].allowedHosts,
        options.outboundRules,
      ).map((offer, index) => ({ offer, rank: offset + index })),
    );

    // Las tiendas que fallaron no pasan al cursor: se pierden en esta búsqueda,
    // pero así "cargar más" nunca se queda reintentando una tienda caída.
    const nextOffsets: StoreOffsets = {};
    for (const { result, offset, status } of outcomes) {
      if (!result) continue;
      const next = offset + pageSize;
      if (next < result.total) nextOffsets[status.id] = next;
    }

    return {
      query: request.query.trim(),
      fetchedAt: now().toISOString(),
      groups: sortGroups(groupOffers(ranked), request.sort).map(({ group }) => group),
      stores: statuses,
      nextCursor: encodeCursor(nextOffsets),
    };
  }

  return { search, stores: () => adapters.map((adapter) => adapter.store) };
}

export type SearchService = ReturnType<typeof createSearchService>;
