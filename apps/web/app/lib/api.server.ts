import type {
  ApiErrorResponse,
  HealthResponse,
  SearchResponse,
  SearchSort,
  StoreStatus,
  StoresResponse,
} from "@lower-prices/shared";

// Solo se ejecuta en el servidor (sufijo .server): la URL de la API no llega al navegador.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function fetchApiHealth(timeoutMs = 1500): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export async function fetchStores(timeoutMs = 1500): Promise<StoresResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/stores`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return (await res.json()) as StoresResponse;
  } catch {
    return null;
  }
}

export interface SearchParams {
  q: string;
  sort: SearchSort;
  cursor?: string | undefined;
}

/** Resultado de buscar: éxito, o el motivo de la falla para mostrar el estado correcto. */
export type SearchResult =
  | { ok: true; data: SearchResponse }
  | { ok: false; reason: "all_stores_failed"; stores: StoreStatus[] }
  | { ok: false; reason: "invalid_request" | "unavailable" };

export async function searchProducts(
  params: SearchParams,
  timeoutMs = 8000,
): Promise<SearchResult> {
  const query = new URLSearchParams({ q: params.q, sort: params.sort });
  if (params.cursor) query.set("cursor", params.cursor);

  try {
    const res = await fetch(`${API_URL}/api/search?${query.toString()}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return { ok: true, data: (await res.json()) as SearchResponse };

    const body = (await res.json().catch(() => ({}))) as Partial<ApiErrorResponse>;
    if (body.error === "all_stores_failed") {
      return { ok: false, reason: "all_stores_failed", stores: body.stores ?? [] };
    }
    if (body.error === "invalid_request" || body.error === "invalid_cursor") {
      return { ok: false, reason: "invalid_request" };
    }
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
