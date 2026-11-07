import { describe, expect, it } from "vitest";

import { createMemoryCache } from "../cache/memory.js";
import type { Cache } from "../cache/types.js";
import { createMockStore, makeOffer } from "../test/mock-store.js";
import { createCircuitBreaker } from "./circuit-breaker.js";
import { decodeCursor, encodeCursor, InvalidCursorError } from "./cursor.js";
import { AllStoresFailedError, createSearchService, normalizeQuery } from "./service.js";
import type { StoreAdapter } from "../stores/types.js";

function offers(storeId: string, count: number, startPrice = 100) {
  return Array.from({ length: count }, (_, i) =>
    makeOffer(storeId, { title: `Producto ${storeId}${i}`, price: startPrice + i }),
  );
}

function service(adapters: StoreAdapter[], cache: Cache = createMemoryCache()) {
  return createSearchService({
    adapters,
    cache,
    timeoutMs: 50,
    pageSize: 2,
    cacheTtlSeconds: 60,
    now: () => new Date("2026-11-07T12:00:00.000Z"),
  });
}

describe("cursor", () => {
  it("codifica y decodifica los offsets", () => {
    const cursor = encodeCursor({ elektra: 10, chedraui: 20 });
    expect(cursor).not.toBeNull();
    expect(decodeCursor(cursor!)).toEqual({ elektra: 10, chedraui: 20 });
  });

  it("devuelve null si no quedan tiendas con resultados", () => {
    expect(encodeCursor({})).toBeNull();
  });

  it("rechaza cursores manipulados", () => {
    expect(() => decodeCursor("no-es-base64-json")).toThrow(InvalidCursorError);
    const negative = Buffer.from(JSON.stringify({ elektra: -1 })).toString("base64url");
    expect(() => decodeCursor(negative)).toThrow(InvalidCursorError);
  });
});

describe("normalizeQuery", () => {
  it("unifica espacios y mayúsculas para la caché", () => {
    expect(normalizeQuery("  TV   Samsung ")).toBe("tv samsung");
  });
});

describe("createSearchService", () => {
  it("consulta todas las tiendas en paralelo e informa su estado", async () => {
    const a = createMockStore("a", { offers: offers("a", 3) });
    const b = createMockStore("b", { offers: offers("b", 1) });

    const result = await service([a, b]).search({ query: "producto", sort: "relevance" });

    expect(result.fetchedAt).toBe("2026-11-07T12:00:00.000Z");
    expect(result.groups).toHaveLength(3);
    expect(result.stores).toEqual([
      expect.objectContaining({ id: "a", status: "ok", count: 2 }),
      expect.objectContaining({ id: "b", status: "ok", count: 1 }),
    ]);
    // Solo "a" tiene más resultados.
    expect(decodeCursor(result.nextCursor!)).toEqual({ a: 2 });
  });

  it("devuelve respuesta parcial si una tienda tarda demasiado o falla", async () => {
    const ok = createMockStore("ok", { offers: offers("ok", 1) });
    const slow = createMockStore("slow", { offers: offers("slow", 1), delayMs: 1000 });
    const broken = createMockStore("broken", { fail: true });

    const result = await service([ok, slow, broken]).search({
      query: "producto",
      sort: "relevance",
    });

    expect(result.groups).toHaveLength(1);
    expect(result.stores.map(({ id, status }) => [id, status])).toEqual([
      ["ok", "ok"],
      ["slow", "timeout"],
      ["broken", "error"],
    ]);
    expect(result.stores[1]?.durationMs).toBeLessThan(500);
    expect(result.nextCursor).toBeNull();
  });

  it("lanza AllStoresFailedError si ninguna tienda responde", async () => {
    const broken = createMockStore("broken", { fail: true });
    const slow = createMockStore("slow", { delayMs: 1000 });

    await expect(
      service([broken, slow]).search({ query: "producto", sort: "relevance" }),
    ).rejects.toBeInstanceOf(AllStoresFailedError);
  });

  it("'cargar más' consulta solo las tiendas del cursor desde su offset", async () => {
    const a = createMockStore("a", { offers: offers("a", 5) });
    const b = createMockStore("b", { offers: offers("b", 1) });
    const search = service([a, b]);

    const first = await search.search({ query: "producto", sort: "relevance" });
    const second = await search.search({
      query: "producto",
      sort: "relevance",
      cursor: first.nextCursor!,
    });

    expect(b.calls).toHaveLength(1);
    expect(a.calls.map((call) => call.offset)).toEqual([0, 2]);
    expect(second.groups.map((group) => group.title)).toEqual(["Producto a2", "Producto a3"]);
    expect(decodeCursor(second.nextCursor!)).toEqual({ a: 4 });
  });

  it("respeta el filtro de tiendas", async () => {
    const a = createMockStore("a", { offers: offers("a", 1) });
    const b = createMockStore("b", { offers: offers("b", 1) });

    const result = await service([a, b]).search({
      query: "producto",
      sort: "relevance",
      stores: ["b"],
    });

    expect(a.calls).toHaveLength(0);
    expect(result.stores.map((store) => store.id)).toEqual(["b"]);
  });

  it("ordena por precio cuando se pide", async () => {
    const a = createMockStore("a", {
      offers: [makeOffer("a", { title: "Producto caro", price: 900 })],
    });
    const b = createMockStore("b", {
      offers: [makeOffer("b", { title: "Producto barato", price: 100 })],
    });

    const asc = await service([a, b]).search({ query: "producto", sort: "price_asc" });
    const desc = await service([a, b]).search({ query: "producto", sort: "price_desc" });

    expect(asc.groups.map((group) => group.title)).toEqual(["Producto barato", "Producto caro"]);
    expect(desc.groups.map((group) => group.title)).toEqual(["Producto caro", "Producto barato"]);
  });

  it("usa la caché por tienda en búsquedas repetidas", async () => {
    const a = createMockStore("a", { offers: offers("a", 1) });
    const search = service([a]);

    await search.search({ query: "PRODUCTO", sort: "relevance" });
    await new Promise((resolve) => setTimeout(resolve, 0)); // la escritura en caché no bloquea
    await search.search({ query: "  producto ", sort: "relevance" });

    expect(a.calls).toHaveLength(1);
  });

  it("si la caché falla, la búsqueda sigue funcionando", async () => {
    const brokenCache: Cache = {
      kind: "memory",
      get: () => Promise.reject(new Error("caída")),
      set: () => Promise.reject(new Error("caída")),
    };
    const a = createMockStore("a", { offers: offers("a", 1) });

    const result = await service([a], brokenCache).search({ query: "producto", sort: "relevance" });

    expect(result.groups).toHaveLength(1);
  });
});

describe("createCircuitBreaker", () => {
  it("pausa la tienda tras N fallas seguidas y la reactiva al pasar la pausa", () => {
    let time = 0;
    const breaker = createCircuitBreaker({ threshold: 2, cooldownMs: 1000, now: () => time });

    breaker.recordFailure("a");
    expect(breaker.isPaused("a")).toBe(false);
    breaker.recordFailure("a");
    expect(breaker.isPaused("a")).toBe(true);

    time = 1001;
    expect(breaker.isPaused("a")).toBe(false);
    // Falla el intento de prueba: se pausa de nuevo de inmediato.
    breaker.recordFailure("a");
    expect(breaker.isPaused("a")).toBe(true);

    time = 3000;
    breaker.recordSuccess("a");
    breaker.recordFailure("a");
    expect(breaker.isPaused("a")).toBe(false);
  });
});

describe("resiliencia y eficiencia del servicio", () => {
  it("deja de consultar una tienda que falla seguido y la marca como 'paused'", async () => {
    const ok = createMockStore("ok", { offers: offers("ok", 1) });
    const broken = createMockStore("broken", { fail: true });
    const search = createSearchService({
      adapters: [ok, broken],
      cache: createMemoryCache(),
      timeoutMs: 50,
      pageSize: 2,
      cacheTtlSeconds: 60,
      circuitBreaker: createCircuitBreaker({ threshold: 2, cooldownMs: 60_000 }),
    });

    await search.search({ query: "uno", sort: "relevance" });
    await search.search({ query: "dos", sort: "relevance" });
    const third = await search.search({ query: "tres", sort: "relevance" });

    expect(broken.calls).toHaveLength(2);
    expect(third.stores.find((store) => store.id === "broken")?.status).toBe("paused");
  });

  it("una tienda en pausa todavía sirve resultados de la caché", async () => {
    const breaker = createCircuitBreaker({ threshold: 1, cooldownMs: 60_000 });
    const a = createMockStore("a", { offers: offers("a", 1) });
    const search = createSearchService({
      adapters: [a],
      cache: createMemoryCache(),
      timeoutMs: 50,
      pageSize: 2,
      cacheTtlSeconds: 60,
      circuitBreaker: breaker,
    });

    await search.search({ query: "producto", sort: "relevance" });
    await new Promise((resolve) => setTimeout(resolve, 0));
    breaker.recordFailure("a");
    const result = await search.search({ query: "producto", sort: "relevance" });

    expect(result.stores[0]?.status).toBe("ok");
    expect(result.groups).toHaveLength(1);
  });

  it("dos búsquedas iguales al mismo tiempo consultan la tienda una sola vez", async () => {
    const a = createMockStore("a", { offers: offers("a", 1), delayMs: 20 });
    const search = service([a]);

    const [first, second] = await Promise.all([
      search.search({ query: "producto", sort: "relevance" }),
      search.search({ query: "PRODUCTO ", sort: "relevance" }),
    ]);

    expect(a.calls).toHaveLength(1);
    expect(first.groups).toEqual(second.groups);
  });

  it("aplica las reglas de enlace de salida y descarta enlaces ajenos", async () => {
    const a = createMockStore("a", {
      offers: [
        makeOffer("a", { title: "Producto bueno", url: "https://a.example/p/1" }),
        makeOffer("a", { title: "Producto malo", url: "https://phishing.example/p/2" }),
      ],
    });
    const search = createSearchService({
      adapters: [a],
      cache: createMemoryCache(),
      timeoutMs: 50,
      pageSize: 2,
      cacheTtlSeconds: 60,
      outboundRules: { a: (url) => url.searchParams.set("ref", "lp") },
    });

    const result = await search.search({ query: "producto", sort: "relevance" });

    expect(result.groups.map((group) => group.offers[0]?.url)).toEqual([
      "https://a.example/p/1?ref=lp",
    ]);
  });
});

describe("orden por relevancia con accesorios", () => {
  it("baja al final los accesorios que no se buscaron", async () => {
    const a = createMockStore("a", {
      offers: [
        makeOffer("a", { title: "Funda para iPhone 16", price: 300 }),
        makeOffer("a", { title: "iPhone 16 128GB", price: 15000 }),
      ],
    });

    const result = await service([a]).search({ query: "iphone 16", sort: "relevance" });

    expect(result.groups.map((group) => group.title)).toEqual([
      "iPhone 16 128GB",
      "Funda para iPhone 16",
    ]);
  });
});
