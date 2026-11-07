import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildVtexSearchUrl,
  createVtexAdapter,
  parseResourcesTotal,
  sanitizeVtexQuery,
  VtexError,
} from "./adapter.js";

interface Fixture {
  store: string;
  status: number;
  resources: string | null;
  body: unknown[];
}

function loadFixture(name: string): Fixture {
  const file = path.join(import.meta.dirname, "__fixtures__", `${name}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as Fixture;
}

/** fetch falso que responde con un fixture grabado y guarda las URLs pedidas. */
function fixtureFetch(fixture: Fixture) {
  const urls: string[] = [];
  const fakeFetch: typeof fetch = async (input) => {
    urls.push(String(input));
    return new Response(JSON.stringify(fixture.body), {
      status: fixture.status,
      headers: fixture.resources ? { resources: fixture.resources } : {},
    });
  };
  return { fakeFetch, urls };
}

const chedraui = { id: "chedraui", name: "Chedraui", baseUrl: "https://www.chedraui.com.mx" };
const now = () => new Date("2026-11-07T12:00:00.000Z");

describe("buildVtexSearchUrl", () => {
  it("codifica los espacios como %20 (VTEX rechaza '+')", () => {
    const url = buildVtexSearchUrl(chedraui.baseUrl, {
      query: "pantalla tcl",
      offset: 10,
      limit: 10,
      sort: "relevance",
    });
    expect(url.href).toBe(
      "https://www.chedraui.com.mx/api/catalog_system/pub/products/search?ft=pantalla%20tcl&_from=10&_to=19",
    );
  });

  it("agrega orden y rango de precio", () => {
    const url = buildVtexSearchUrl(chedraui.baseUrl, {
      query: "tv",
      offset: 0,
      limit: 5,
      sort: "price_asc",
      minPrice: 500,
    });
    expect(url.search).toContain("O=OrderByPriceASC");
    expect(url.search).toContain(`fq=${encodeURIComponent("P:[500 TO 999999999]")}`);
  });
});

describe("sanitizeVtexQuery", () => {
  it("quita caracteres que bloquea el firewall de VTEX", () => {
    expect(sanitizeVtexQuery('iphone 15 (128gb) "pro"')).toBe("iphone 15 128gb pro");
    expect(sanitizeVtexQuery("audífonos <b>")).toBe("audífonos b");
    expect(sanitizeVtexQuery("wh-1000xm5 100%")).toBe("wh-1000xm5 100%");
  });
});

describe("parseResourcesTotal", () => {
  it("lee el total de la cabecera resources", () => {
    expect(parseResourcesTotal("0-9/278")).toBe(278);
    expect(parseResourcesTotal(null)).toBeUndefined();
  });
});

describe("createVtexAdapter con respuestas reales grabadas", () => {
  it("mapea los productos de Chedraui al modelo común", async () => {
    const fixture = loadFixture("chedraui.audifonos");
    const { fakeFetch } = fixtureFetch(fixture);
    const adapter = createVtexAdapter(chedraui, { fetch: fakeFetch, now });

    const result = await adapter.search({
      query: "audifonos",
      offset: 0,
      limit: 10,
      sort: "relevance",
    });

    expect(result.total).toBe(278);
    expect(result.offers).toHaveLength(10);

    const soundcore = result.offers.find((offer) => offer.id === "chedraui:3905102");
    expect(soundcore).toMatchObject({
      store: { id: "chedraui", name: "Chedraui" },
      title: "Audifonos Soundcore P41i Negro",
      url: expect.stringMatching(/^https:\/\/www\.chedraui\.com\.mx\/.+\/p$/),
      price: 1421.25,
      originalPrice: 1895,
      discountPercent: 25,
      currency: "MXN",
      available: true,
      condition: "new",
      identifiers: { gtin: "00194644276409", brand: "Soundcore", sku: "3905102" },
      fetchedAt: "2026-11-07T12:00:00.000Z",
    });
    expect(soundcore?.installments).toEqual([
      { months: 3, amount: 473.75, interestFree: true },
      { months: 6, amount: 236.87, interestFree: true },
      { months: 13, amount: 109.32, interestFree: true },
    ]);
  });

  it("usa al vendedor de marketplace con stock e ignora al vendedor '1' con precio 0", async () => {
    const { fakeFetch } = fixtureFetch(loadFixture("chedraui.audifonos"));
    const adapter = createVtexAdapter(chedraui, { fetch: fakeFetch, now });

    const { offers } = await adapter.search({
      query: "audifonos",
      offset: 0,
      limit: 10,
      sort: "relevance",
    });

    const behringer = offers.find((offer) => offer.id === "chedraui:6001673");
    expect(behringer).toMatchObject({ price: 399, available: true });
    expect(behringer?.originalPrice).toBeUndefined();
  });

  it("lee el modelo de la especificación 'Modelo' (Elektra)", async () => {
    const { fakeFetch } = fixtureFetch(loadFixture("elektra.audifonos"));
    const adapter = createVtexAdapter(
      { id: "elektra", name: "Elektra", baseUrl: "https://www.elektra.mx" },
      { fetch: fakeFetch, now },
    );

    const { offers } = await adapter.search({
      query: "audifonos",
      offset: 0,
      limit: 10,
      sort: "relevance",
    });

    const akg = offers.find((offer) => offer.id === "elektra:1300724723");
    expect(akg?.identifiers).toMatchObject({ brand: "AKG", model: "K702" });
    expect(akg?.installments.map((plan) => plan.months)).toEqual([3, 4, 6, 7, 8, 9, 12]);
  });

  it("no cuenta como MSI los planes con intereses (OfficeMax)", async () => {
    const { fakeFetch } = fixtureFetch(loadFixture("officemax.audifonos"));
    const adapter = createVtexAdapter(
      { id: "officemax", name: "OfficeMax", baseUrl: "https://www.officemax.com.mx" },
      { fetch: fakeFetch, now },
    );

    const { offers } = await adapter.search({
      query: "audifonos",
      offset: 0,
      limit: 10,
      sort: "relevance",
    });

    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((offer) => offer.installments.length === 0)).toBe(true);
  });

  it("devuelve vacío sin llamar a la tienda si la búsqueda queda vacía al limpiarla", async () => {
    const { fakeFetch, urls } = fixtureFetch(loadFixture("chedraui.audifonos"));
    const adapter = createVtexAdapter(chedraui, { fetch: fakeFetch, now });

    const result = await adapter.search({ query: '"()"', offset: 0, limit: 10, sort: "relevance" });

    expect(result).toEqual({ offers: [], total: 0 });
    expect(urls).toHaveLength(0);
  });

  it("descarta productos usados o reacondicionados y los que no pasan la validación", async () => {
    const fixture = loadFixture("chedraui.audifonos");
    const [first, second] = fixture.body as Record<string, unknown>[];
    const body = [
      { ...first, productName: "Audífonos Reacondicionados" },
      { broken: true },
      second,
    ];
    const { fakeFetch } = fixtureFetch({ ...fixture, body });
    const adapter = createVtexAdapter(chedraui, { fetch: fakeFetch, now });

    const { offers } = await adapter.search({
      query: "audifonos",
      offset: 0,
      limit: 10,
      sort: "relevance",
    });

    expect(offers).toHaveLength(1);
  });

  it("lanza VtexError si la tienda responde con error o sin JSON", async () => {
    const blocked: typeof fetch = async () => new Response("Bad Request!", { status: 400 });
    const html: typeof fetch = async () => new Response("<html>", { status: 200 });

    await expect(
      createVtexAdapter(chedraui, { fetch: blocked }).search({
        query: "tv",
        offset: 0,
        limit: 10,
        sort: "relevance",
      }),
    ).rejects.toBeInstanceOf(VtexError);
    await expect(
      createVtexAdapter(chedraui, { fetch: html }).search({
        query: "tv",
        offset: 0,
        limit: 10,
        sort: "relevance",
      }),
    ).rejects.toBeInstanceOf(VtexError);
  });
});

describe("tiendas oficiales de marca (respuestas reales grabadas)", () => {
  async function searchFixture(
    name: string,
    config: { id: string; name: string; baseUrl: string },
  ) {
    const { fakeFetch } = fixtureFetch(loadFixture(name));
    const adapter = createVtexAdapter(config, { fetch: fakeFetch, now });
    return adapter.search({ query: "x", offset: 0, limit: 10, sort: "relevance" });
  }

  it("Whirlpool: precio con descuento y meses sin intereses de 3 a 12", async () => {
    const { offers, total } = await searchFixture("whirlpool.lavadora", {
      id: "whirlpool",
      name: "Whirlpool",
      baseUrl: "https://www.whirlpool.mx",
    });

    expect(total).toBe(116);
    const lavadora = offers.find((offer) => offer.id === "whirlpool:409");
    expect(lavadora).toMatchObject({ price: 9999, originalPrice: 15999, discountPercent: 38 });
    expect(lavadora?.identifiers?.gtin).toBe("00883049643717");
    expect(lavadora?.installments.map((plan) => plan.months)).toEqual([3, 6, 9, 12]);
  });

  it("T-fal: lee el modelo de la especificación", async () => {
    const { offers } = await searchFixture("tfal.sarten", {
      id: "tfal",
      name: "T-fal",
      baseUrl: "https://www.t-fal.com.mx",
    });

    expect(offers.find((offer) => offer.id === "tfal:111")?.identifiers).toMatchObject({
      brand: "T-fal",
      model: "g2930202",
    });
  });

  it("Sony: sin código de barras la oferta queda sin GTIN (se agrupará por modelo o título)", async () => {
    const { offers } = await searchFixture("sony.audifonos", {
      id: "sony",
      name: "Sony",
      baseUrl: "https://store.sony.com.mx",
    });

    const mdr = offers.find((offer) => offer.id === "sony:2091");
    expect(mdr).toMatchObject({ title: "Audífonos Profesionales MDR-7506", price: 1699 });
    expect(mdr?.identifiers?.gtin).toBeUndefined();
  });

  it("Oster: mapea todas las ofertas sin descuento", async () => {
    const { offers } = await searchFixture("oster.licuadora", {
      id: "oster",
      name: "Oster",
      baseUrl: "https://www.oster.com.mx",
    });

    expect(offers).toHaveLength(10);
    expect(offers.find((offer) => offer.id === "oster:683")).toMatchObject({ price: 889 });
  });
});

describe("tiendas multimarca (respuestas reales grabadas)", () => {
  async function searchFixture(
    name: string,
    config: { id: string; name: string; baseUrl: string },
  ) {
    const { fakeFetch } = fixtureFetch(loadFixture(name));
    const adapter = createVtexAdapter(config, { fetch: fakeFetch, now });
    return adapter.search({ query: "x", offset: 0, limit: 10, sort: "relevance" });
  }

  it("Mixup: marca real y meses sin intereses", async () => {
    const { offers } = await searchFixture("mixup.audifonos", {
      id: "mixup",
      name: "Mixup",
      baseUrl: "https://www.mixup.com",
    });

    const bose = offers.find((offer) => offer.id === "mixup:83263");
    expect(bose).toMatchObject({ title: "Audifonos Quietcomfort", price: 6999 });
    expect(bose?.identifiers?.brand).toBe("Bose");
    expect(bose?.installments.map((plan) => plan.months)).toEqual([3, 6]);
  });

  it("Juguetron: LEGO con código de barras válido para agrupar con otras tiendas", async () => {
    const { offers } = await searchFixture("juguetron.lego", {
      id: "juguetron",
      name: "Juguetron",
      baseUrl: "https://www.juguetron.mx",
    });

    expect(offers.find((offer) => offer.id === "juguetron:3961")?.identifiers).toMatchObject({
      gtin: "00673419359597",
      brand: "LEGO",
    });
  });

  it("Farmacias Similares: ignora «PICK UP» como marca", async () => {
    const { offers } = await searchFixture("similares.paracetamol", {
      id: "similares",
      name: "Farmacias Similares",
      baseUrl: "https://www.farmaciasdesimilares.com",
    });

    const paracetamol = offers.find((offer) => offer.id === "similares:813");
    expect(paracetamol).toMatchObject({ price: 18 });
    expect(paracetamol?.identifiers?.brand).toBeUndefined();
  });
});
