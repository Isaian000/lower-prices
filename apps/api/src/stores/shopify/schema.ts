import { z } from "zod";

// Respuesta de la herramienta `search_catalog` del servidor UCP/MCP de Shopify
// (capacidad dev.ucp.shopping.catalog.search, versión 2026-08-25).
// Solo se validan los campos que usa el adaptador. El resto se ignora.

/** Montos en unidades menores de la moneda: { amount: 189900, currency: "MXN" } = $1,899.00. */
const moneySchema = z.object({
  amount: z.number().int(),
  currency: z.string(),
});

const mediaSchema = z.object({
  type: z.string(),
  url: z.string(),
});

const variantSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: moneySchema,
  list_price: moneySchema.optional(),
  availability: z.object({ available: z.boolean().optional() }).optional(),
  sku: z.string().optional(),
  url: z.string().optional(),
  media: z.array(mediaSchema).optional(),
});

export const ucpProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  handle: z.string().optional(),
  url: z.string().optional(),
  media: z.array(mediaSchema).optional(),
  variants: z.array(variantSchema),
  gift_card: z.boolean().optional(),
});

export const ucpSearchResultSchema = z.object({
  products: z.array(z.unknown()),
  pagination: z
    .object({
      has_next_page: z.boolean(),
      total_count: z.number().int().optional(),
    })
    .optional(),
});

/** Respuesta JSON-RPC: `result.structuredContent` trae la búsqueda; `error` si falló. */
export const jsonRpcResponseSchema = z.object({
  result: z
    .object({
      structuredContent: z.unknown().optional(),
      isError: z.boolean().optional(),
    })
    .optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.object({ code: z.string().optional() }).loose().optional(),
    })
    .optional(),
});

export type UcpProduct = z.infer<typeof ucpProductSchema>;
export type UcpVariant = z.infer<typeof variantSchema>;
export type UcpMoney = z.infer<typeof moneySchema>;
