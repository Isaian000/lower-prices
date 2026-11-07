// Contrato de datos compartido entre la API y la web (ver README, "Modelo de datos común").

export interface Store {
  /** Identificador interno, p. ej. "elektra". */
  id: string;
  /** Nombre visible, p. ej. "Elektra". */
  name: string;
  logoUrl?: string;
}

export interface Installment {
  months: number;
  /** Pago mensual en MXN. */
  amount: number;
  /** true = meses sin intereses. */
  interestFree: boolean;
}

export type ProductCondition = "new";

export interface ProductIdentifiers {
  gtin?: string;
  brand?: string;
  model?: string;
  sku?: string;
}

export interface Offer {
  /** "<storeId>:<id en la tienda>" */
  id: string;
  store: Store;
  title: string;
  url: string;
  imageUrl?: string;
  /** Precio actual en MXN. */
  price: number;
  /** Precio antes del descuento. */
  originalPrice?: number;
  discountPercent?: number;
  currency: "MXN";
  available: boolean;
  /** En el MVP solo productos nuevos (RF-09). */
  condition: ProductCondition;
  /** Vacío si la tienda no informa meses sin intereses. */
  installments: Installment[];
  identifiers?: ProductIdentifiers;
  /** ISO 8601 */
  fetchedAt: string;
}

export type MatchedBy = "gtin" | "model" | "title" | "single";

export interface ProductGroup {
  id: string;
  title: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  lowestPrice: number;
  highestPrice: number;
  offerCount: number;
  matchedBy: MatchedBy;
  /** Ordenadas por precio ascendente. */
  offers: Offer[];
}

/**
 * - `ok`: respondió (o vino de caché).
 * - `timeout`: no respondió a tiempo.
 * - `error`: respondió con error.
 * - `paused`: falló varias veces seguidas y se dejó de consultar unos minutos.
 */
export type StoreStatusCode = "ok" | "timeout" | "error" | "paused";

export interface StoreStatus {
  id: string;
  status: StoreStatusCode;
  count: number;
  durationMs: number;
}

export type SearchSort = "relevance" | "price_asc" | "price_desc";

/** Respuesta de GET /api/search */
export interface SearchResponse {
  query: string;
  fetchedAt: string;
  groups: ProductGroup[];
  stores: StoreStatus[];
  /** null = no hay más resultados. */
  nextCursor: string | null;
}

/** Respuesta de GET /api/stores */
export interface StoresResponse {
  stores: Store[];
}

/** Cuerpo de las respuestas de error de la API. */
export interface ApiErrorResponse {
  error:
    "invalid_request" | "invalid_cursor" | "all_stores_failed" | "not_found" | "internal_error";
  /** Detalle de validación, solo en `invalid_request`. */
  details?: string[];
  /** Estado de cada tienda, solo en `all_stores_failed`. */
  stores?: StoreStatus[];
}

/** Respuesta de GET /api/health */
export interface HealthResponse {
  status: "ok";
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}
