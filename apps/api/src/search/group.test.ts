import { describe, expect, it } from "vitest";

import { makeOffer } from "../test/mock-store.js";
import { groupOffers, type RankedOffer } from "./group.js";
import { diceSimilarity, titleTokens } from "./normalize-title.js";

function ranked(...offers: ReturnType<typeof makeOffer>[]): RankedOffer[] {
  return offers.map((offer, rank) => ({ offer, rank }));
}

describe("titleTokens", () => {
  it("normaliza acentos, unidades y palabras de relleno", () => {
    expect([...titleTokens('Pantalla TCL 55" Smart TV Envío Gratis')]).toEqual([
      "pantalla",
      "tcl",
      "55in",
      "smart",
      "tv",
    ]);
    expect(titleTokens("iPhone 15 128 GB")).toEqual(titleTokens("iphone 15 128gb"));
    expect(titleTokens("Pantalla 55 pulgadas")).toEqual(titleTokens("Pantalla 55 in"));
  });

  it("mide la similitud con Dice", () => {
    expect(diceSimilarity(new Set(["a", "b"]), new Set(["a", "b"]))).toBe(1);
    expect(diceSimilarity(new Set(["a", "b"]), new Set(["c"]))).toBe(0);
  });
});

describe("groupOffers", () => {
  it("nivel 1: agrupa por GTIN entre tiendas y ordena por precio", () => {
    const gtin = "00846042073158";
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", {
          title: "Pantalla QLED TCL 65 Pulgadas",
          price: 6997,
          identifiers: { gtin },
        }),
        makeOffer("chedraui", {
          title: "Pantalla 65 Pulgadas TCL QLED",
          price: 12209,
          identifiers: { gtin },
        }),
      ),
    );

    expect(groups).toHaveLength(1);
    const [{ group }] = groups as [(typeof groups)[number]];
    expect(group).toMatchObject({
      id: `gtin:${gtin}`,
      matchedBy: "gtin",
      offerCount: 2,
      lowestPrice: 6997,
      highestPrice: 12209,
    });
    expect(group.offers.map((offer) => offer.store.id)).toEqual(["elektra", "chedraui"]);
  });

  it("nivel 2: agrupa por marca + modelo aunque falte el GTIN", () => {
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", {
          title: "Audífonos inalámbricos con cancelación de ruido",
          price: 5899,
          identifiers: { brand: "SONY", model: "WH-1000XM5" },
        }),
        makeOffer("chedraui", {
          title: "Sony WH1000XM5 Negro",
          price: 6499,
          identifiers: { brand: "Sony", model: "wh 1000 xm5", gtin: "04548736132600" },
        }),
      ),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.group).toMatchObject({ matchedBy: "model", offerCount: 2 });
  });

  it("nivel 3: agrupa por títulos parecidos con la misma marca", () => {
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", {
          title: "Licuadora Oster 10 velocidades BLSTMG",
          price: 1199,
          identifiers: { brand: "Oster" },
        }),
        makeOffer("marti", {
          title: "Licuadora Oster BLSTMG 10 Velocidades",
          price: 1099,
          identifiers: { brand: "OSTER" },
        }),
      ),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.group.matchedBy).toBe("title");
  });

  it("no agrupa por título si las marcas son distintas", () => {
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", {
          title: "Licuadora 10 velocidades vaso de vidrio",
          identifiers: { brand: "Oster" },
        }),
        makeOffer("marti", {
          title: "Licuadora 10 velocidades vaso de vidrio",
          identifiers: { brand: "Black+Decker" },
        }),
      ),
    );

    expect(groups).toHaveLength(2);
  });

  it("no junta variantes con GTIN distinto aunque el título sea casi igual (colores)", () => {
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", {
          title: "Audífonos JBL T530BT Blanco",
          identifiers: { brand: "JBL", gtin: "00050036416931" },
        }),
        makeOffer("chedraui", {
          title: "Audífonos JBL T530BT Azul",
          identifiers: { brand: "JBL", gtin: "00194644276409" },
        }),
      ),
    );

    expect(groups).toHaveLength(2);
  });

  it("no junta dos publicaciones distintas de la misma tienda", () => {
    const groups = groupOffers(
      ranked(
        makeOffer("chedraui", {
          title: "Audífonos Realme Buds T200 Verde",
          identifiers: { brand: "Realme" },
        }),
        makeOffer("chedraui", {
          title: "Audífonos Realme Buds T200 Verde",
          identifiers: { brand: "Realme" },
        }),
      ),
    );

    expect(groups).toHaveLength(2);
    expect(new Set(groups.map(({ group }) => group.id)).size).toBe(2);
  });

  it("junta duplicados de una tienda con el mismo GTIN y deja la mejor oferta", () => {
    const gtin = "00726597162739";
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", { price: 249, identifiers: { gtin } }),
        makeOffer("elektra", { price: 199, identifiers: { gtin } }),
        makeOffer("elektra", { price: 99, available: false, identifiers: { gtin } }),
      ),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.group).toMatchObject({
      offerCount: 1,
      lowestPrice: 199,
      matchedBy: "single",
    });
    expect(groups[0]?.rank).toBe(0);
  });

  it("saca del grupo un accesorio con precio atípico (la 'trampa')", () => {
    const brand = "Apple";
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", {
          title: "iPhone 15 128GB Negro",
          price: 15999,
          identifiers: { brand },
        }),
        makeOffer("chedraui", {
          title: "iPhone 15 128 GB Negro",
          price: 16499,
          identifiers: { brand },
        }),
        makeOffer("marti", {
          title: "Funda iPhone 15 128GB Negro",
          price: 299,
          identifiers: { brand },
        }),
      ),
      { titleThreshold: 0.75 },
    );

    const main = groups.find(({ group }) => group.offerCount === 2);
    expect(main?.group.offers.map((offer) => offer.store.id).toSorted()).toEqual([
      "chedraui",
      "elektra",
    ]);
    const trap = groups.find(({ group }) => group.offers[0]?.store.id === "marti");
    expect(trap?.group.matchedBy).toBe("single");
  });

  it("calcula el rango de precios solo con ofertas con stock", () => {
    const gtin = "00194644276409";
    const groups = groupOffers(
      ranked(
        makeOffer("elektra", { price: 500, available: false, identifiers: { gtin } }),
        makeOffer("chedraui", { price: 900, identifiers: { gtin } }),
      ),
    );

    expect(groups[0]?.group).toMatchObject({ lowestPrice: 900, highestPrice: 900 });
    expect(groups[0]?.group.offers.map((offer) => offer.available)).toEqual([true, false]);
  });
});
