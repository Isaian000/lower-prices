import type { Offer, SearchSort, Store } from "@lower-prices/shared";

export interface StoreSearchParams {
  query: string;
  /** Posición del primer resultado (0 = inicio). */
  offset: number;
  limit: number;
  sort: SearchSort;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  /** Se aborta cuando vence el timeout de la tienda. */
  signal?: AbortSignal | undefined;
}

export interface StoreSearchResult {
  /** Ofertas en el orden de relevancia de la tienda. */
  offers: Offer[];
  /** Total de resultados que informa la tienda para la búsqueda. */
  total: number;
}

/** Contrato que cumple cada fuente de datos (API oficial, afiliados, VTEX, etc.). */
export interface StoreAdapter {
  readonly store: Store;
  /** Dominios a los que pueden apuntar los enlaces de sus ofertas (p. ej. "www.elektra.mx"). */
  readonly allowedHosts: readonly string[];
  search(params: StoreSearchParams): Promise<StoreSearchResult>;
}
