import { describe, expect, it } from "vitest";

import { looksNotNew, normalizeBrand, normalizeGtin, normalizeModel } from "./product.js";

describe("normalizeGtin", () => {
  it("lleva EAN-13 y UPC-12 a 14 dígitos", () => {
    expect(normalizeGtin("0050036416986")).toBe("00050036416986");
    expect(normalizeGtin("50036416986")).toBe("00050036416986");
    expect(normalizeGtin("846042073158")).toBe("00846042073158");
    expect(normalizeGtin("0846042073158")).toBe("00846042073158");
  });

  it("descarta códigos con dígito de control inválido (EAN truncados)", () => {
    expect(normalizeGtin("84046404132")).toBeUndefined();
    expect(normalizeGtin("194644276408")).toBeUndefined();
    expect(normalizeGtin("194644276409")).toBe("00194644276409");
  });

  it("descarta valores vacíos, cortos o solo ceros", () => {
    expect(normalizeGtin(undefined)).toBeUndefined();
    expect(normalizeGtin("")).toBeUndefined();
    expect(normalizeGtin("1234")).toBeUndefined();
    expect(normalizeGtin("00000000")).toBeUndefined();
  });
});

describe("normalizeBrand", () => {
  it("ignora marcas genéricas", () => {
    expect(normalizeBrand("GENERICA")).toBeUndefined();
    expect(normalizeBrand("Genérico")).toBeUndefined();
    expect(normalizeBrand(" Sony ")).toBe("Sony");
  });
});

describe("normalizeModel", () => {
  it("acepta modelos con dígitos", () => {
    expect(normalizeModel("WH-1000XM5")).toBe("WH-1000XM5");
    expect(normalizeModel("55S453")).toBe("55S453");
  });

  it("descarta textos que no son modelos", () => {
    expect(normalizeModel("Mando a distancia universal")).toBeUndefined();
    expect(normalizeModel("N/A")).toBeUndefined();
    expect(normalizeModel("X1")).toBeUndefined();
  });
});

describe("looksNotNew", () => {
  it("detecta productos usados o reacondicionados (RF-09)", () => {
    expect(looksNotNew("iPhone 13 Reacondicionado")).toBe(true);
    expect(looksNotNew("Laptop seminueva")).toBe(true);
    expect(looksNotNew("Consola USADA")).toBe(true);
    expect(looksNotNew("Audífonos Sony WH-1000XM5")).toBe(false);
  });
});
