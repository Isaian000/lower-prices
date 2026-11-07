import { createShopifyAdapter, type ShopifyStoreConfig } from "./shopify/adapter.js";
import type { StoreAdapter } from "./types.js";
import { createVtexAdapter, type VtexStoreConfig } from "./vtex/adapter.js";

/**
 * Tiendas con API pública de catálogo VTEX (verificadas el 2026-11-06 y 2026-11-07, ver README).
 * Para sumar otra tienda VTEX basta con agregarla aquí.
 */
export const VTEX_STORES: readonly VtexStoreConfig[] = [
  { id: "elektra", name: "Elektra", baseUrl: "https://www.elektra.mx" },
  { id: "chedraui", name: "Chedraui", baseUrl: "https://www.chedraui.com.mx" },
  { id: "officemax", name: "OfficeMax", baseUrl: "https://www.officemax.com.mx" },
  { id: "marti", name: "Martí", baseUrl: "https://www.marti.mx" },
  // Tiendas oficiales de marca: venden solo sus productos.
  { id: "whirlpool", name: "Whirlpool", baseUrl: "https://www.whirlpool.mx" },
  { id: "oster", name: "Oster", baseUrl: "https://www.oster.com.mx" },
  { id: "tfal", name: "T-fal", baseUrl: "https://www.t-fal.com.mx" },
  { id: "sony", name: "Sony", baseUrl: "https://store.sony.com.mx" },
  // Verificadas el 2026-11-07 en la búsqueda amplia de tiendas (ver docs de planeación).
  { id: "mixup", name: "Mixup", baseUrl: "https://www.mixup.com" },
  { id: "ishop", name: "iShop Mixup", baseUrl: "https://www.ishopmixup.com" },
  { id: "juguetron", name: "Juguetron", baseUrl: "https://www.juguetron.mx" },
  { id: "similares", name: "Farmacias Similares", baseUrl: "https://www.farmaciasdesimilares.com" },
  { id: "vinoteca", name: "Vinoteca", baseUrl: "https://www.vinoteca.com" },
  { id: "devlyn", name: "Devlyn", baseUrl: "https://www.devlyn.com.mx" },
  { id: "miniso", name: "Miniso", baseUrl: "https://www.miniso.com.mx" },
  { id: "voit", name: "Voit", baseUrl: "https://www.voit.com.mx" },
  { id: "asics", name: "Asics", baseUrl: "https://www.asics.com.mx" },
  { id: "vans", name: "Vans", baseUrl: "https://www.vans.mx" },
  { id: "timberland", name: "Timberland", baseUrl: "https://www.timberland.com.mx" },
  { id: "thenorthface", name: "The North Face", baseUrl: "https://www.thenorthface.com.mx" },
  { id: "levis", name: "Levi's", baseUrl: "https://www.levi.com.mx" },
  { id: "guess", name: "Guess", baseUrl: "https://www.guess.mx" },
  { id: "carters", name: "Carter's", baseUrl: "https://www.carters.com.mx" },
];

const shop = (subdomain: string) => `https://${subdomain}.myshopify.com/api/ucp/mcp`;

/**
 * Tiendas Shopify con servidor UCP/MCP oficial (catálogo verificado el 2026-11-07 en
 * su /.well-known/ucp). `brand` solo en tiendas oficiales de una marca.
 */
export const SHOPIFY_STORES: readonly ShopifyStoreConfig[] = [
  // Multimarca
  { id: "maskota", name: "+Kota", baseUrl: "https://maskota.com.mx", endpoint: shop("maskota-mx") },
  { id: "doto", name: "Doto", baseUrl: "https://www.doto.com.mx", endpoint: shop("beta-doto") },
  {
    id: "calzzapato",
    name: "Calzzapato",
    baseUrl: "https://www.calzzapato.com",
    endpoint: shop("gpuibs-58"),
  },
  {
    id: "cklass",
    name: "Cklass",
    baseUrl: "https://www.cklass.com",
    endpoint: shop("cklassonline"),
  },
  {
    id: "lolaflora",
    name: "Lolaflora",
    baseUrl: "https://www.lolaflora.com.mx",
    endpoint: shop("ruqgjb-q0"),
  },
  {
    id: "wecare",
    name: "WeCare Pharma",
    baseUrl: "https://www.wecarepharma.mx",
    endpoint: shop("wecarepharmamx"),
  },
  {
    id: "lacastellana",
    name: "La Castellana",
    baseUrl: "https://www.lacastellana.com",
    endpoint: shop("la-castellana-mx"),
  },
  {
    id: "laeuropea",
    name: "La Europea",
    baseUrl: "https://www.laeuropea.com.mx",
    endpoint: shop("la-europea-mx"),
  },
  // Tiendas oficiales de marca
  {
    id: "aldoconti",
    name: "Aldo Conti",
    brand: "Aldo Conti",
    baseUrl: "https://www.aldoconti.com",
    endpoint: shop("aldoconti"),
  },
  {
    id: "crocs",
    name: "Crocs",
    brand: "Crocs",
    baseUrl: "https://www.crocs.com.mx",
    endpoint: shop("crocs-mex"),
  },
  {
    id: "stevemadden",
    name: "Steve Madden",
    brand: "Steve Madden",
    baseUrl: "https://www.stevemadden.com.mx",
    endpoint: shop("stevemadden-mx"),
  },
  {
    id: "koblenz",
    name: "Koblenz",
    brand: "Koblenz",
    baseUrl: "https://www.koblenz.com.mx",
    endpoint: shop("koblenz-mx"),
  },
  {
    id: "taurus",
    name: "Taurus",
    brand: "Taurus",
    baseUrl: "https://www.taurus.com.mx",
    endpoint: shop("taurusmexico"),
  },
  {
    id: "jafra",
    name: "Jafra",
    brand: "Jafra",
    baseUrl: "https://www.jafra.com.mx",
    endpoint: shop("jafra-mx"),
  },
  {
    id: "newera",
    name: "New Era",
    brand: "New Era",
    baseUrl: "https://www.newera.mx",
    endpoint: shop("neweramexico"),
  },
  {
    id: "tupperware",
    name: "Tupperware",
    brand: "Tupperware",
    baseUrl: "https://www.tupperware.com.mx",
    endpoint: shop("tupperware-mx"),
  },
  {
    id: "oggi",
    name: "Oggi",
    brand: "Oggi",
    baseUrl: "https://www.oggi.mx",
    endpoint: shop("9d3731-0b"),
  },
  {
    id: "shasa",
    name: "Shasa",
    brand: "Shasa",
    baseUrl: "https://www.shasa.com",
    endpoint: shop("shasamx"),
  },
  {
    id: "wrangler",
    name: "Wrangler",
    brand: "Wrangler",
    baseUrl: "https://www.wrangler.com.mx",
    endpoint: shop("kontoor-wrangler"),
  },
  {
    id: "columbia",
    name: "Columbia",
    brand: "Columbia",
    baseUrl: "https://www.columbia.mx",
    endpoint: shop("columbia-sportswear-mexico"),
  },
  {
    id: "merrell",
    name: "Merrell",
    brand: "Merrell",
    baseUrl: "https://www.merrell.com.mx",
    endpoint: shop("merrell-mx"),
  },
  {
    id: "salomon",
    name: "Salomon",
    brand: "Salomon",
    baseUrl: "https://www.salomon.com.mx",
    endpoint: shop("salomon-mx"),
  },
  {
    id: "gopro",
    name: "GoPro",
    brand: "GoPro",
    baseUrl: "https://www.gopro.mx",
    endpoint: shop("gopromx"),
  },
];

export interface DefaultAdapterOptions {
  /** Sin perfil de agente UCP publicado no se consultan las tiendas Shopify. */
  ucpAgentProfileUrl?: string | undefined;
}

export function createDefaultAdapters(options: DefaultAdapterOptions = {}): StoreAdapter[] {
  const vtex = VTEX_STORES.map((config) => createVtexAdapter(config));
  const { ucpAgentProfileUrl } = options;
  if (!ucpAgentProfileUrl) return vtex;
  return [
    ...vtex,
    ...SHOPIFY_STORES.map((config) =>
      createShopifyAdapter(config, { agentProfileUrl: ucpAgentProfileUrl }),
    ),
  ];
}
