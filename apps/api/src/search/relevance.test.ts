import { describe, expect, it } from "vitest";

import { makeOffer } from "../test/mock-store.js";
import { filterRelevant, isRelevant, isUnsoughtAccessory, queryTerms } from "./relevance.js";

const titles = (offers: ReturnType<typeof makeOffer>[]) => offers.map((offer) => offer.title);

describe("queryTerms", () => {
  it("normaliza acentos, quita conectores y lleva a singular", () => {
    expect(queryTerms("Audífonos para PC")).toEqual(["audifono", "pc"]);
    expect(queryTerms("pantallas de 55 pulgadas")).toEqual(["pantalla", "55", "pulgada"]);
  });
});

describe("isRelevant", () => {
  it("acepta coincidencias con plurales, acentos y modelos con guiones", () => {
    expect(
      isRelevant(makeOffer("a", { title: "Audífono Sony" }), queryTerms("audifonos sony")),
    ).toBe(true);
    expect(
      isRelevant(
        makeOffer("a", { title: "Audífonos inalámbricos", identifiers: { model: "WH-1000XM5" } }),
        queryTerms("wh 1000xm5"),
      ),
    ).toBe(true);
  });

  it("usa la marca aunque no esté en el nombre", () => {
    const offer = makeOffer("a", {
      title: "Licuadora 10 velocidades",
      identifiers: { brand: "Oster" },
    });
    expect(isRelevant(offer, queryTerms("licuadora oster"))).toBe(true);
  });

  it("con una o dos palabras exige todas", () => {
    const jeans = makeOffer("levis", { title: "Levi's 501 Original Jeans" });
    expect(isRelevant(jeans, queryTerms("pantalla"))).toBe(false);
    expect(
      isRelevant(makeOffer("a", { title: "Audífonos JBL" }), queryTerms("audifonos sony")),
    ).toBe(false);
  });

  it("con tres o más palabras basta el 60 %", () => {
    const tv = makeOffer("a", { title: "Pantalla QLED TCL 4K 65Q5K" });
    expect(isRelevant(tv, queryTerms("pantalla tcl 65 pulgadas"))).toBe(true);
  });

  it("una búsqueda sin palabras útiles no filtra nada", () => {
    expect(isRelevant(makeOffer("a", { title: "Lo que sea" }), queryTerms("de la"))).toBe(true);
  });
});

describe("filterRelevant", () => {
  it("quita resultados ajenos de tiendas de un solo giro y accesorios", () => {
    const offers = [
      makeOffer("elektra", { title: "Pantalla TCL 55 Pulgadas 4K" }),
      makeOffer("levis", { title: "Levi's 501 Original Jeans" }),
      makeOffer("officemax", { title: "Soporte de pared para pantallas de 32 a 70" }),
    ];

    expect(titles(filterRelevant(offers, "pantalla tcl"))).toEqual(["Pantalla TCL 55 Pulgadas 4K"]);
  });
});

describe("isUnsoughtAccessory", () => {
  it("marca accesorios que no se buscaron, aunque lleven la marca antes", () => {
    const terms = queryTerms("iphone 16");
    expect(
      isUnsoughtAccessory(makeOffer("a", { title: "Funda Para Celular iPhone 16" }), terms),
    ).toBe(true);
    expect(
      isUnsoughtAccessory(makeOffer("a", { title: "DEVIA FUNDA PURE MAG IPHONE 16" }), terms),
    ).toBe(true);
    expect(
      isUnsoughtAccessory(makeOffer("a", { title: "APPLE IPHONE 16 128GB + ADAPTADOR" }), terms),
    ).toBe(false);
  });

  it("no castiga el accesorio si es lo que se busca", () => {
    const offer = makeOffer("a", { title: "Fundas para iPhone 16" });
    expect(isUnsoughtAccessory(offer, queryTerms("funda iphone 16"))).toBe(false);
  });
});
