import { describe, expect, it } from "vitest";

import { createDefaultAdapters, SHOPIFY_STORES, VTEX_STORES } from "./registry.js";

describe("registro de tiendas", () => {
  it("tiene ids únicos y orígenes https", () => {
    const stores = [...VTEX_STORES, ...SHOPIFY_STORES];
    const ids = stores.map((store) => store.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const store of stores) {
      expect(store.id).toMatch(/^[a-z0-9-]+$/);
      expect(new URL(store.baseUrl).protocol).toBe("https:");
    }
    for (const store of SHOPIFY_STORES) {
      expect(store.endpoint).toMatch(/^https:\/\/[a-z0-9-]+\.myshopify\.com\/api\/ucp\/mcp$/);
    }
  });

  it("crea un adaptador por tienda con su dominio permitido para los enlaces", () => {
    const adapters = createDefaultAdapters();
    expect(adapters).toHaveLength(VTEX_STORES.length);
    expect(adapters.find((a) => a.store.id === "sony")?.allowedHosts).toEqual([
      "store.sony.com.mx",
    ]);
  });

  it("suma las tiendas Shopify solo si hay perfil de agente UCP", () => {
    const adapters = createDefaultAdapters({
      ucpAgentProfileUrl: "https://api.example.mx/.well-known/ucp",
    });
    expect(adapters).toHaveLength(VTEX_STORES.length + SHOPIFY_STORES.length);
    // La marca es interna del adaptador: no se publica en la lista de tiendas.
    expect(adapters.find((a) => a.store.id === "crocs")?.store).toEqual({
      id: "crocs",
      name: "Crocs",
    });
  });
});
