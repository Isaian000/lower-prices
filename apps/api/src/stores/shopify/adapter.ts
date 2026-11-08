import type { Offer, Store } from "@lower-prices/shared";

import { type HttpFetch, httpFetch, type HttpResponse } from "../../lib/http.js";
import type { StoreAdapter, StoreSearchParams, StoreSearchResult } from "../types.js";
import { mapUcpProduct } from "./map.js";
import { jsonRpcResponseSchema, ucpProductSchema, ucpSearchResultSchema } from "./schema.js";

export interface ShopifyStoreConfig extends Store {
  /** Origen público de la tienda, p. ej. "https://www.crocs.com.mx". */
  baseUrl: string;
  /** Servidor UCP/MCP que publica la tienda en /.well-known/ucp. */
  endpoint: string;
  /** Marca de las tiendas oficiales; se omite en tiendas multimarca. */
  brand?: string;
}

export interface ShopifyAdapterDeps {
  /** URL pública del perfil de agente UCP; la tienda la descarga para validar cada consulta. */
  agentProfileUrl: string;
  fetch?: HttpFetch;
  now?: () => Date;
}

/**
 * search_catalog pagina con un cursor opaco y devuelve hasta 250 productos por consulta.
 * Para encajar con la paginación por posición del servicio, se piden los primeros
 * `offset + limit` y se recorta; por eso no se pasa de 250 resultados por búsqueda.
 */
const MAX_RESULTS = 250;

export class ShopifyUcpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ShopifyUcpError";
  }
}

export function buildSearchCatalogRequest(
  params: StoreSearchParams,
  agentProfileUrl: string,
  id: number,
) {
  const limit = Math.min(params.offset + params.limit, MAX_RESULTS);
  const price =
    params.minPrice !== undefined || params.maxPrice !== undefined
      ? {
          price: {
            ...(params.minPrice !== undefined ? { min: Math.round(params.minPrice * 100) } : {}),
            ...(params.maxPrice !== undefined ? { max: Math.round(params.maxPrice * 100) } : {}),
          },
        }
      : undefined;

  return {
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: {
      name: "search_catalog",
      arguments: {
        meta: { "ucp-agent": { profile: agentProfileUrl } },
        catalog: {
          query: params.query.trim(),
          context: { address_country: "MX", currency: "MXN", language: "es-MX" },
          ...(price ? { filters: price } : {}),
          pagination: { limit },
        },
      },
    },
  };
}

/** El servidor MCP puede responder JSON o un flujo SSE; en SSE el JSON va en las líneas `data:`. */
async function readJsonRpcBody(response: HttpResponse): Promise<unknown> {
  const text = await response.text();
  if (!response.headers.get("content-type")?.includes("text/event-stream")) {
    return JSON.parse(text) as unknown;
  }
  const data = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .findLast((line) => line.startsWith("{"));
  if (!data) throw new SyntaxError("Flujo SSE sin datos");
  return JSON.parse(data) as unknown;
}

/**
 * Adaptador para tiendas Shopify vía su servidor oficial UCP/MCP (herramienta
 * `search_catalog`). La misma implementación sirve para cualquier tienda Shopify
 * que publique /.well-known/ucp: solo cambian `baseUrl` y `endpoint`.
 */
export function createShopifyAdapter(
  config: ShopifyStoreConfig,
  deps: ShopifyAdapterDeps,
): StoreAdapter {
  const doFetch = deps.fetch ?? httpFetch;
  const now = deps.now ?? (() => new Date());
  const { baseUrl, endpoint, brand, ...store } = config;
  let requestId = 0;

  async function search(params: StoreSearchParams): Promise<StoreSearchResult> {
    if (params.offset >= MAX_RESULTS || !params.query.trim()) return { offers: [], total: 0 };

    requestId += 1;
    const response = await doFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": "lower-prices/0.1",
      },
      body: JSON.stringify(buildSearchCatalogRequest(params, deps.agentProfileUrl, requestId)),
      signal: params.signal ?? null,
    });

    if (!response.ok) {
      throw new ShopifyUcpError(`${store.id} respondió ${response.status}`, response.status);
    }

    const parsed = jsonRpcResponseSchema.safeParse(
      await readJsonRpcBody(response).catch(() => ({})),
    );
    if (!parsed.success) throw new ShopifyUcpError(`${store.id} devolvió un formato inesperado`);

    const { result, error } = parsed.data;
    if (error) {
      throw new ShopifyUcpError(`${store.id}: ${error.message}`, undefined, error.data?.code);
    }
    const content = ucpSearchResultSchema.safeParse(result?.structuredContent);
    if (result?.isError || !content.success) {
      throw new ShopifyUcpError(`${store.id} no devolvió resultados de catálogo`);
    }

    const { products, pagination } = content.data;
    const context = { store, baseUrl, brand, fetchedAt: now().toISOString() };
    const offers: Offer[] = [];
    for (const raw of products.slice(params.offset)) {
      // Un producto con datos raros no debe tumbar toda la búsqueda.
      const product = ucpProductSchema.safeParse(raw);
      if (!product.success) continue;
      const offer = mapUcpProduct(product.data, context);
      if (offer) offers.push(offer);
    }

    const total = pagination?.has_next_page
      ? Math.max(pagination.total_count ?? MAX_RESULTS, products.length + 1)
      : products.length;
    return { offers, total: Math.min(total, MAX_RESULTS) };
  }

  return {
    store,
    allowedHosts: [new URL(baseUrl).hostname, new URL(endpoint).hostname],
    search,
  };
}
