import { describe, expect, it } from "vitest";

import { makeOffer } from "../test/mock-store.js";
import { buildOutboundUrl, withOutboundUrls } from "./outbound.js";

const elektra = ["www.elektra.mx"];

describe("buildOutboundUrl", () => {
  it("deja pasar enlaces https al dominio de la tienda", () => {
    expect(buildOutboundUrl("https://www.elektra.mx/tv/p", "elektra", elektra)).toBe(
      "https://www.elektra.mx/tv/p",
    );
    expect(buildOutboundUrl("https://elektra.mx/tv/p", "elektra", elektra)).toBe(
      "https://elektra.mx/tv/p",
    );
  });

  it("rechaza otros dominios, http y javascript:", () => {
    expect(buildOutboundUrl("https://elektra.mx.evil.com/p", "elektra", elektra)).toBeUndefined();
    expect(buildOutboundUrl("http://www.elektra.mx/p", "elektra", elektra)).toBeUndefined();
    expect(buildOutboundUrl("javascript:alert(1)", "elektra", elektra)).toBeUndefined();
    expect(buildOutboundUrl("no es url", "elektra", elektra)).toBeUndefined();
  });

  it("aplica la regla de afiliado de la tienda", () => {
    const rules = { amazon: (url: URL) => url.searchParams.set("tag", "mi-tag-20") };

    expect(
      buildOutboundUrl(
        "https://www.amazon.com.mx/dp/B0X?th=1",
        "amazon",
        ["www.amazon.com.mx"],
        rules,
      ),
    ).toBe("https://www.amazon.com.mx/dp/B0X?th=1&tag=mi-tag-20");
    expect(buildOutboundUrl("https://www.elektra.mx/p", "elektra", elektra, rules)).toBe(
      "https://www.elektra.mx/p",
    );
  });
});

describe("withOutboundUrls", () => {
  it("descarta ofertas con enlace inválido", () => {
    const offers = [
      makeOffer("elektra", { url: "https://www.elektra.mx/ok/p" }),
      makeOffer("elektra", { url: "https://otro-sitio.com/p" }),
    ];

    expect(withOutboundUrls(offers, elektra).map((offer) => offer.url)).toEqual([
      "https://www.elektra.mx/ok/p",
    ]);
  });
});
