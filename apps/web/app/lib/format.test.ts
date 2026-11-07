import { describe, expect, it } from "vitest";

import { formatBoardPrice, formatDateTime, formatPrice } from "./format";
import { thumbnailUrl } from "./images";

describe("formatPrice", () => {
  it("formatea pesos mexicanos con separador de miles y 2 decimales", () => {
    expect(formatPrice(1299)).toBe("$1,299.00");
    expect(formatPrice(491.5)).toBe("$491.50");
  });
});

describe("formatBoardPrice", () => {
  it("omite los centavos cuando son cero y los muestra cuando existen", () => {
    expect(formatBoardPrice(5990)).toBe("$5,990");
    expect(formatBoardPrice(906.5)).toBe("$906.50");
    expect(formatBoardPrice(109.32)).toBe("$109.32");
  });
});

describe("formatDateTime", () => {
  it("usa formato de fecha mexicano (día/mes/año) en hora de CDMX", () => {
    expect(formatDateTime("2026-11-06T18:30:00Z")).toMatch(/^06\/11\/26/);
  });
});

describe("thumbnailUrl", () => {
  it("pide a VTEX una miniatura del tamaño indicado", () => {
    expect(
      thumbnailUrl("https://chedrauimx.vteximg.com.br/arquivos/ids/79791962/foto.jpg?v=1", 160),
    ).toBe("https://chedrauimx.vteximg.com.br/arquivos/ids/79791962-160-160/foto.jpg?v=1");
  });

  it("deja igual cualquier otra URL", () => {
    expect(thumbnailUrl("https://example.com/a.jpg", 160)).toBe("https://example.com/a.jpg");
  });
});
