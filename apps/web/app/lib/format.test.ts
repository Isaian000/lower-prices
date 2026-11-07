import { describe, expect, it } from "vitest";

import { formatDateTime, formatPrice } from "./format";

describe("formatPrice", () => {
  it("formatea pesos mexicanos con separador de miles y 2 decimales", () => {
    expect(formatPrice(1299)).toBe("$1,299.00");
    expect(formatPrice(491.5)).toBe("$491.50");
  });
});

describe("formatDateTime", () => {
  it("usa formato de fecha mexicano (día/mes/año) en hora de CDMX", () => {
    expect(formatDateTime("2026-11-06T18:30:00Z")).toMatch(/^06\/11\/26/);
  });
});
