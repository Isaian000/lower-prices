/** Versión del protocolo UCP con la que se probó el adaptador. */
export const UCP_VERSION = "2026-08-25";

/**
 * Perfil de agente UCP. La API lo sirve en GET /.well-known/ucp y cada consulta a una
 * tienda Shopify envía su URL pública (UCP_AGENT_PROFILE_URL); la tienda lo descarga
 * para saber qué capacidades usa el agente. Solo se declara la lectura del catálogo:
 * lower-prices no crea carritos ni compra.
 */
export const ucpAgentProfile = {
  ucp: {
    version: UCP_VERSION,
    capabilities: {
      "dev.ucp.shopping.catalog.search": [{ version: UCP_VERSION }],
      "dev.ucp.shopping.catalog.lookup": [{ version: UCP_VERSION }],
      "dev.shopify.catalog": [{ version: UCP_VERSION }],
    },
  },
} as const;
