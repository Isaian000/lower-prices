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

describe("sinónimos", () => {
  const relevant = (title: string, query: string, brand?: string) =>
    isRelevant(
      makeOffer("a", { title, ...(brand ? { identifiers: { brand } } : {}) }),
      queryTerms(query),
    );

  it("une las frases con sinónimo en un solo término", () => {
    expect(queryTerms("computadoras portátiles")).toEqual(["computadora portatil"]);
    expect(queryTerms("laptop gamer")).toEqual(["laptop", "gamer"]);
  });

  it("acepta nombres distintos de lo mismo, en ambos sentidos", () => {
    expect(relevant("Laptop HP Probook 465 G11", "computadora portatil")).toBe(true);
    expect(relevant("Computadora portátil Dell Latitude 7430", "laptop")).toBe(true);
    expect(relevant("Smartphone Xiaomi Note 15 256 GB", "celular")).toBe(true);
    expect(relevant("Celular Poco C85 6GB 128GB", "smartphone")).toBe(true);
    expect(relevant("Televisión Pantalla 75 Pulgadas Sharp Roku TV", "televisor")).toBe(true);
    expect(relevant("Smart TV Hisense 55", "pantalla")).toBe(true);
  });

  it("los sinónimos de un solo sentido no traen el grupo completo", () => {
    expect(relevant("APPLE IPHONE 16 128GB", "celular")).toBe(true);
    expect(relevant("Celular Poco C85 6GB 128GB", "iphone")).toBe(false);
    expect(relevant("Consola PlayStation 5 Slim", "consola")).toBe(true);
    expect(relevant("Consola Nintendo Switch 2", "xbox")).toBe(false);
  });

  it("compara sinónimos por inicio de palabra", () => {
    expect(relevant("GoPro HERO13 Black Full Bundle", "camara gopro", "GoPro")).toBe(true);
    expect(relevant("Figura Superhero Marvel", "camara")).toBe(false);
    // "tv" no debe coincidir dentro de otra palabra.
    expect(relevant("Cable HDMI ATVision", "pantalla")).toBe(false);
  });

  it("no acepta palabras que solo comparten raíz", () => {
    expect(relevant("Recipiente para refrigerar 500 ml Tupperware", "refrigerador")).toBe(false);
    expect(relevant("Mordedera Ricitos De Oro Refrigerable", "refrigerador")).toBe(false);
    expect(relevant("Samsung Refrigerador RT35DG5724S9", "nevera")).toBe(true);
  });

  it("acepta plurales en el nombre del producto", () => {
    expect(relevant("Audífonos Inalámbricos Sony", "auricular")).toBe(true);
    expect(relevant("Televisores LG 4K", "television")).toBe(true);
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

  it("marca como accesorio lo que es «para» el producto buscado", () => {
    const terms = queryTerms("laptop");
    expect(isUnsoughtAccessory(makeOffer("a", { title: "Mochila Para Laptop 16" }), terms)).toBe(
      true,
    );
    expect(
      isUnsoughtAccessory(
        makeOffer("a", { title: "Anillo para celular gema" }),
        queryTerms("celular"),
      ),
    ).toBe(true);
    // Lo buscado aparece antes de "para": es el producto, no un accesorio.
    expect(
      isUnsoughtAccessory(
        makeOffer("a", { title: "Laptop HP 15 para estudiantes" }),
        queryTerms("laptop"),
      ),
    ).toBe(false);
    expect(
      isUnsoughtAccessory(
        makeOffer("a", { title: "Croquetas para perro adulto" }),
        queryTerms("croquetas"),
      ),
    ).toBe(false);
  });

  it("un sinónimo de la búsqueda cuenta como buscado", () => {
    const offer = makeOffer("a", { title: "Mochila Kånken Laptop 13" });
    expect(isUnsoughtAccessory(offer, queryTerms("backpack laptop"))).toBe(false);
  });

  it("no castiga el accesorio si es lo que se busca", () => {
    const offer = makeOffer("a", { title: "Fundas para iPhone 16" });
    expect(isUnsoughtAccessory(offer, queryTerms("funda iphone 16"))).toBe(false);
  });
});
