import { describe, expect, it } from "vitest";

import { buildSearchCatalogRequest, createShopifyAdapter, ShopifyUcpError } from "./adapter.js";

// Respuestas armadas a mano según el outputSchema que publica search_catalog
// (UCP 2026-08-25). Se reemplazarán por grabaciones reales cuando el perfil de
// agente esté publicado en un dominio propio.

const crocs = {
  id: "crocs",
  name: "Crocs",
  brand: "Crocs",
  baseUrl: "https://www.crocs.com.mx",
  endpoint: "https://crocs-mex.myshopify.com/api/ucp/mcp",
};
const profile = "https://api.lower-prices.example/.well-known/ucp";
const now = () => new Date("2026-11-07T12:00:00.000Z");
const mxn = (amount: number) => ({ amount, currency: "MXN" });

function product(n: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `gid://shopify/Product/${n}`,
    title: `Sandalia Classic ${n}`,
    description: { html: "<p>Sandalia</p>" },
    handle: `sandalia-classic-${n}`,
    url: `https://www.crocs.com.mx/products/sandalia-classic-${n}`,
    price_range: { min: mxn(89900), max: mxn(99900) },
    media: [{ type: "image", url: `https://cdn.shopify.com/${n}.jpg` }],
    variants: [
      {
        id: `gid://shopify/ProductVariant/${n}1`,
        title: "26",
        description: { html: "" },
        price: mxn(99900),
        availability: { available: true },
        sku: `20699${n}-26`,
      },
      {
        id: `gid://shopify/ProductVariant/${n}2`,
        title: "27",
        description: { html: "" },
        price: mxn(89900),
        list_price: mxn(129900),
        availability: { available: true },
        sku: `20699${n}-27`,
      },
    ],
    ...overrides,
  };
}

function rpcResult(products: unknown[], pagination: Record<string, unknown>) {
  return {
    jsonrpc: "2.0",
    id: 1,
    result: {
      content: [{ type: "text", text: "..." }],
      structuredContent: { ucp: { version: "2026-08-25" }, products, pagination },
    },
  };
}

function fakeFetch(body: unknown, init: ResponseInit = {}) {
  const requests: { url: string; body: unknown }[] = [];
  const doFetch: typeof fetch = async (input, request) => {
    requests.push({ url: String(input), body: JSON.parse(String(request?.body)) });
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json" },
      ...init,
    });
  };
  return { doFetch, requests };
}

describe("buildSearchCatalogRequest", () => {
  it("manda el perfil de agente, el contexto de México y el precio en centavos", () => {
    const request = buildSearchCatalogRequest(
      {
        query: " sandalias ",
        offset: 10,
        limit: 10,
        sort: "relevance",
        minPrice: 500,
        maxPrice: 1200.5,
      },
      profile,
      7,
    );
    expect(request).toEqual({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "search_catalog",
        arguments: {
          meta: { "ucp-agent": { profile } },
          catalog: {
            query: "sandalias",
            context: { address_country: "MX", currency: "MXN", language: "es-MX" },
            filters: { price: { min: 50000, max: 120050 } },
            pagination: { limit: 20 },
          },
        },
      },
    });
  });

  it("no pide más de 250 productos", () => {
    const request = buildSearchCatalogRequest(
      { query: "x", offset: 245, limit: 10, sort: "relevance" },
      profile,
      1,
    );
    expect(request.params.arguments.catalog.pagination.limit).toBe(250);
    expect(request.params.arguments.catalog).not.toHaveProperty("filters");
  });
});

describe("createShopifyAdapter", () => {
  it("convierte productos UCP en ofertas: variante más barata, pesos y descuento", async () => {
    const { doFetch, requests } = fakeFetch(rpcResult([product(1)], { has_next_page: false }));
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    const result = await adapter.search({
      query: "sandalias",
      offset: 0,
      limit: 10,
      sort: "relevance",
    });

    expect(requests[0]?.url).toBe(crocs.endpoint);
    expect(result.total).toBe(1);
    expect(result.offers).toEqual([
      {
        id: "crocs:1",
        store: { id: "crocs", name: "Crocs" },
        title: "Sandalia Classic 1",
        url: "https://www.crocs.com.mx/products/sandalia-classic-1",
        imageUrl: "https://cdn.shopify.com/1.jpg",
        price: 899,
        originalPrice: 1299,
        discountPercent: 31,
        currency: "MXN",
        available: true,
        condition: "new",
        installments: [],
        identifiers: { brand: "Crocs", sku: "206991-27" },
        fetchedAt: "2026-11-07T12:00:00.000Z",
      },
    ]);
  });

  it("pagina por posición: recorta los ya mostrados e informa que hay más", async () => {
    const products = Array.from({ length: 20 }, (_, i) => product(i + 1));
    const { doFetch } = fakeFetch(rpcResult(products, { has_next_page: true, total_count: 57 }));
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    const result = await adapter.search({
      query: "sandalias",
      offset: 10,
      limit: 10,
      sort: "relevance",
    });

    expect(result.offers.map((offer) => offer.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `crocs:${i + 11}`),
    );
    expect(result.total).toBe(57);
  });

  it("descarta tarjetas de regalo, precios en otra moneda y productos inválidos", async () => {
    const usd = product(3, {
      variants: [
        {
          id: "v",
          title: "U",
          description: { html: "" },
          price: { amount: 5000, currency: "USD" },
        },
      ],
    });
    const body = rpcResult(
      [product(2, { gift_card: true }), usd, { id: "roto" }, product(4, { url: undefined })],
      { has_next_page: false },
    );
    const { doFetch } = fakeFetch(body);
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    const result = await adapter.search({ query: "x", offset: 0, limit: 10, sort: "relevance" });

    // Sin `url` se arma el enlace con el handle.
    expect(result.offers.map((offer) => offer.url)).toEqual([
      "https://www.crocs.com.mx/products/sandalia-classic-4",
    ]);
  });

  it("marca agotado si ninguna variante tiene stock", async () => {
    const soldOut = product(5, {
      variants: [
        {
          id: "v",
          title: "26",
          description: { html: "" },
          price: mxn(50000),
          availability: { available: false },
        },
      ],
    });
    const { doFetch } = fakeFetch(rpcResult([soldOut], { has_next_page: false }));
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    const [offer] = (await adapter.search({ query: "x", offset: 0, limit: 10, sort: "relevance" }))
      .offers;
    expect(offer).toMatchObject({ price: 500, available: false });
  });

  it("lee respuestas en flujo SSE", async () => {
    const sse = `event: message\ndata: ${JSON.stringify(rpcResult([product(6)], { has_next_page: false }))}\n\n`;
    const { doFetch } = fakeFetch(sse, { headers: { "content-type": "text/event-stream" } });
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    const result = await adapter.search({ query: "x", offset: 0, limit: 10, sort: "relevance" });
    expect(result.offers).toHaveLength(1);
  });

  it("falla con el código de UCP si la tienda rechaza el perfil", async () => {
    // Respuesta real de crocs-mex.myshopify.com sin perfil de agente (2026-11-07).
    const { doFetch } = fakeFetch({
      jsonrpc: "2.0",
      id: 1,
      error: {
        code: -32001,
        message: "UCP discovery failed",
        data: {
          code: "invalid_profile_url",
          content: "Unable to fetch agent profile: Missing profile uri",
        },
      },
    });
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    const error = await adapter
      .search({ query: "x", offset: 0, limit: 10, sort: "relevance" })
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ShopifyUcpError);
    expect(error).toMatchObject({ code: "invalid_profile_url" });
  });

  it("falla si la tienda responde con error HTTP", async () => {
    const { doFetch } = fakeFetch("", { status: 503 });
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    await expect(
      adapter.search({ query: "x", offset: 0, limit: 10, sort: "relevance" }),
    ).rejects.toMatchObject({ status: 503 });
  });

  it("no consulta sin texto ni más allá de 250 resultados", async () => {
    const { doFetch, requests } = fakeFetch({});
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile, fetch: doFetch, now });

    await adapter.search({ query: "  ", offset: 0, limit: 10, sort: "relevance" });
    await adapter.search({ query: "x", offset: 250, limit: 10, sort: "relevance" });
    expect(requests).toHaveLength(0);
  });

  it("permite enlaces a la tienda y a su dominio myshopify", () => {
    const adapter = createShopifyAdapter(crocs, { agentProfileUrl: profile });
    expect(adapter.allowedHosts).toEqual(["www.crocs.com.mx", "crocs-mex.myshopify.com"]);
  });
});
