import type {
  ApiErrorResponse,
  HealthResponse,
  SearchResponse,
  StoresResponse,
} from "@lower-prices/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { createMemoryCache } from "./cache/memory.js";
import { createSearchService } from "./search/service.js";
import type { StoreAdapter } from "./stores/types.js";
import { createMockStore, makeOffer } from "./test/mock-store.js";
import { validate } from "./test/schema-validate.js";

function appWith(adapters: StoreAdapter[]) {
  const searchService = createSearchService({
    adapters,
    cache: createMemoryCache(),
    timeoutMs: 50,
    pageSize: 10,
    cacheTtlSeconds: 60,
  });
  return createApp({ searchService, corsOrigins: ["https://web.example"] });
}

const healthyStores = () => [
  createMockStore("a", { offers: [makeOffer("a", { title: "Pantalla" })] }),
  createMockStore("b", { offers: [makeOffer("b", { title: "Pantalla 2" })] }),
];

describe("API", () => {
  const app = appWith(healthyStores());

  it("GET /.well-known/ucp sirve el perfil de agente UCP (solo lectura de catálogo)", async () => {
    const res = await request(app).get("/.well-known/ucp");

    expect(res.status).toBe(200);
    const body = res.body as {
      ucp: {
        version: string;
        services: Record<string, unknown>;
        capabilities: Record<string, unknown>;
        payment_handlers: Record<string, unknown>;
      };
    };
    expect(body.ucp.version).toBe("2026-08-25");
    // Shopify rechaza el perfil sin `services`; la especificación pide ambos registros.
    expect(Object.keys(body.ucp.services)).toEqual(["dev.ucp.shopping"]);
    expect(body.ucp.payment_handlers).toEqual({});
    expect(Object.keys(body.ucp.capabilities)).toEqual([
      "dev.ucp.shopping.catalog.search",
      "dev.ucp.shopping.catalog.lookup",
      "dev.shopify.catalog",
    ]);
  });

  it("GET /api/health responde ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    const body = res.body as HealthResponse;
    expect(body.status).toBe("ok");
    expect(body.service).toBe("api");
    expect(typeof body.uptimeSeconds).toBe("number");
  });

  it("responde 404 en JSON para rutas desconocidas", async () => {
    const res = await request(app).get("/api/no-existe");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found" });
  });

  it("no expone la cabecera x-powered-by", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("GET /api/search", () => {
  it("devuelve grupos y estado por tienda, cacheable en el CDN", async () => {
    const res = await request(appWith(healthyStores()))
      .get("/api/search")
      .query({ q: " pantalla " });

    expect(res.status).toBe(200);
    const body = res.body as SearchResponse;
    expect(body.query).toBe("pantalla");
    expect(body.groups).toHaveLength(2);
    expect(body.stores.map((store) => store.status)).toEqual(["ok", "ok"]);
    expect(body.nextCursor).toBeNull();
    expect(res.headers["cache-control"]).toContain("s-maxage");
  });

  it("no cachea respuestas parciales", async () => {
    const app = appWith([
      createMockStore("a", { offers: [makeOffer("a")] }),
      createMockStore("b", { fail: true }),
    ]);

    const res = await request(app).get("/api/search").query({ q: "tv" });

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it.each([
    [{}, "sin q"],
    [{ q: "   " }, "q vacía"],
    [{ q: "x".repeat(101) }, "q demasiado larga"],
    [{ q: "tv", sort: "barato" }, "sort inválido"],
    [{ q: "tv", minPrice: "500", maxPrice: "100" }, "rango de precio invertido"],
    [{ q: "tv", stores: "a,zzz" }, "tienda desconocida"],
  ])("responde 400 con %o (%s)", async (query: Record<string, string>, _reason: string) => {
    const res = await request(appWith(healthyStores())).get("/api/search").query(query);

    expect(res.status).toBe(400);
    expect((res.body as ApiErrorResponse).error).toBe("invalid_request");
  });

  it("responde 400 con un cursor inválido", async () => {
    const res = await request(appWith(healthyStores()))
      .get("/api/search")
      .query({ q: "tv", cursor: "basura" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "invalid_cursor" });
  });

  it("responde 500 solo si fallan todas las tiendas", async () => {
    const app = appWith([
      createMockStore("a", { fail: true }),
      createMockStore("b", { delayMs: 1000 }),
    ]);

    const res = await request(app).get("/api/search").query({ q: "tv" });

    expect(res.status).toBe(500);
    const body = res.body as ApiErrorResponse;
    expect(body.error).toBe("all_stores_failed");
    expect(body.stores?.map((store) => store.status)).toEqual(["error", "timeout"]);
  });
});

describe("GET /api/stores", () => {
  it("lista las tiendas disponibles", async () => {
    const res = await request(appWith(healthyStores())).get("/api/stores");

    expect(res.status).toBe(200);
    expect((res.body as StoresResponse).stores.map((store) => store.id)).toEqual(["a", "b"]);
  });
});

describe("seguridad", () => {
  const app = appWith(healthyStores());

  it("envía cabeceras de seguridad", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers).toMatchObject({
      "content-security-policy": "default-src 'none';frame-ancestors 'none'",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-resource-policy": "same-origin",
      "origin-agent-cluster": "?1",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "x-content-type-options": "nosniff",
      "x-dns-prefetch-control": "off",
      "x-download-options": "noopen",
      "x-frame-options": "SAMEORIGIN",
      "x-permitted-cross-domain-policies": "none",
      "x-xss-protection": "0",
    });
    expect(res.headers).not.toHaveProperty("x-powered-by");
  });

  it("permite CORS solo a los orígenes configurados", async () => {
    const allowed = await request(app).get("/api/health").set("Origin", "https://web.example");
    const denied = await request(app).get("/api/health").set("Origin", "https://otro.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe("https://web.example");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("documentación OpenAPI", () => {
  const app = appWith([
    createMockStore("a", {
      offers: [
        makeOffer("a", {
          title: "Audífonos Sony WH-1000XM5",
          imageUrl: "https://a.example/img.jpg",
          price: 5899,
          originalPrice: 7499,
          discountPercent: 21,
          installments: [{ months: 12, amount: 491.58, interestFree: true }],
          identifiers: { gtin: "04548736132586", brand: "Sony", model: "WH-1000XM5", sku: "1" },
        }),
        makeOffer("a", { title: "Otro producto", available: false }),
      ],
    }),
    createMockStore("b", { fail: true }),
  ]);

  it("se sirve en /api/openapi.json", async () => {
    const res = await request(app).get("/api/openapi.json");

    expect(res.status).toBe(200);
    expect((res.body as { openapi: string }).openapi).toBe("3.1.0");
  });

  it.each([
    ["/api/health", "HealthResponse"],
    ["/api/stores", "StoresResponse"],
    ["/api/search?q=sony", "SearchResponse"],
    ["/api/search", "ApiError"],
    ["/api/no-existe", "ApiError"],
  ])("la respuesta de %s cumple el esquema %s", async (url, schema) => {
    const res = await request(app).get(url);

    expect(validate(res.body, schema)).toEqual([]);
  });

  it("documenta todos los campos de un grupo con ofertas completas", async () => {
    const res = await request(app).get("/api/search").query({ q: "sony" });
    const body = res.body as SearchResponse;

    expect(body.groups[0]?.offers[0]?.installments).toHaveLength(1);
    expect(body.stores.map((store) => store.status)).toEqual(["ok", "error"]);
  });
});

describe("validador de esquemas (prueba de la prueba)", () => {
  it("detecta campos faltantes, tipos incorrectos y campos sin documentar", () => {
    expect(validate({ status: "ok" }, "HealthResponse")).toContain("$.service: falta");
    expect(validate({ stores: "x" }, "StoresResponse")).toEqual([
      "$.stores: se esperaba array y llegó string",
    ]);
    expect(validate({ error: "not_found", extra: 1 }, "ApiError")).toEqual([
      "$.extra: no está documentado",
    ]);
  });
});
