/** Versión del protocolo UCP con la que se probó el adaptador. */
export const UCP_VERSION = "2026-08-25";

const ucpDev = (path: string) => `https://ucp.dev/${UCP_VERSION}/${path}`;

/**
 * Perfil de agente UCP. La API lo sirve en GET /.well-known/ucp y cada consulta a una
 * tienda Shopify envía su URL pública (UCP_AGENT_PROFILE_URL); la tienda lo descarga
 * para saber qué capacidades usa el agente. Solo se declara la lectura del catálogo:
 * lower-prices no crea carritos ni compra.
 *
 * La especificación pide `services` y `payment_handlers` aunque estén vacíos, y que
 * cada capacidad indique `spec` y `schema` (URLs tomadas del perfil de las tiendas).
 * Shopify rechaza el perfil sin `services` ("profile_malformed: Missing services").
 */
export const ucpAgentProfile = {
  ucp: {
    version: UCP_VERSION,
    services: {
      "dev.ucp.shopping": [
        {
          version: UCP_VERSION,
          spec: ucpDev("specification/overview/"),
          transport: "mcp",
          schema: ucpDev("services/shopping/mcp.openrpc.json"),
        },
      ],
    },
    capabilities: {
      "dev.ucp.shopping.catalog.search": [
        {
          version: UCP_VERSION,
          spec: ucpDev("specification/shopping/catalog/"),
          schema: ucpDev("schemas/shopping/catalog_search.json"),
        },
      ],
      "dev.ucp.shopping.catalog.lookup": [
        {
          version: UCP_VERSION,
          spec: ucpDev("specification/shopping/catalog/"),
          schema: ucpDev("schemas/shopping/catalog_lookup.json"),
        },
      ],
      "dev.shopify.catalog": [
        {
          version: UCP_VERSION,
          spec: "https://shopify.dev/docs/agents/catalog/storefront-catalog",
          schema: `https://shopify.dev/ucp/schemas/${UCP_VERSION}/shopify_catalog.json`,
          extends: ["dev.ucp.shopping.catalog.search", "dev.ucp.shopping.catalog.lookup"],
        },
      ],
    },
    payment_handlers: {},
  },
} as const;
