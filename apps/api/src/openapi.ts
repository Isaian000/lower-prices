/**
 * Documentación de la API en formato OpenAPI 3.1, servida en GET /api/openapi.json.
 * Refleja los tipos de @lower-prices/shared; una prueba valida que las respuestas
 * reales cumplan estos esquemas, así que si cambia un tipo hay que actualizar esto.
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const money = { type: "number", description: "Monto en MXN", examples: [5899] };

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: ref("ApiError") } },
});

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "lower-prices API",
    version: "0.1.0",
    description:
      "Busca un producto en varias tiendas mexicanas a la vez y agrupa las ofertas del mismo producto para comparar precios.",
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Estado de la API",
        responses: {
          "200": {
            description: "La API está en línea",
            content: { "application/json": { schema: ref("HealthResponse") } },
          },
        },
      },
    },
    "/api/stores": {
      get: {
        summary: "Tiendas disponibles",
        responses: {
          "200": {
            description: "Lista de tiendas",
            content: { "application/json": { schema: ref("StoresResponse") } },
          },
        },
      },
    },
    "/api/search": {
      get: {
        summary: "Buscar y comparar",
        description:
          "Consulta las tiendas en paralelo (timeout por tienda) y devuelve los productos agrupados. Si alguna tienda falla, responde 200 con lo que llegó y el estado de cada tienda en `stores`.",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Texto a buscar (1 a 100 caracteres).",
            schema: { type: "string", minLength: 1, maxLength: 100 },
            example: "audifonos sony",
          },
          {
            name: "cursor",
            in: "query",
            description: 'Valor de `nextCursor` de la respuesta anterior, para "cargar más".',
            schema: { type: "string" },
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["relevance", "price_asc", "price_desc"],
              default: "relevance",
            },
          },
          {
            name: "stores",
            in: "query",
            description: "Ids de tiendas separados por coma. Vacío = todas.",
            schema: { type: "string" },
            example: "elektra,chedraui",
          },
          { name: "minPrice", in: "query", schema: { type: "number", minimum: 0 } },
          { name: "maxPrice", in: "query", schema: { type: "number", minimum: 0 } },
        ],
        responses: {
          "200": {
            description:
              "Resultados. Se cachean 5 min en el CDN solo si todas las tiendas respondieron.",
            content: { "application/json": { schema: ref("SearchResponse") } },
          },
          "400": errorResponse(
            "Parámetros inválidos (`invalid_request`) o cursor inválido (`invalid_cursor`)",
          ),
          "500": errorResponse("Ninguna tienda respondió (`all_stores_failed`)"),
        },
      },
    },
  },
  components: {
    schemas: {
      Store: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "string", examples: ["elektra"] },
          name: { type: "string", examples: ["Elektra"] },
          logoUrl: { type: "string", format: "uri" },
        },
      },
      Installment: {
        type: "object",
        description: "Plan de pagos. Hoy solo se incluyen meses sin intereses.",
        required: ["months", "amount", "interestFree"],
        properties: {
          months: { type: "integer", examples: [12] },
          amount: { ...money, description: "Pago mensual en MXN" },
          interestFree: { type: "boolean" },
        },
      },
      Offer: {
        type: "object",
        required: [
          "id",
          "store",
          "title",
          "url",
          "price",
          "currency",
          "available",
          "condition",
          "installments",
          "fetchedAt",
        ],
        properties: {
          id: { type: "string", description: "<storeId>:<id en la tienda>" },
          store: ref("Store"),
          title: { type: "string" },
          url: { type: "string", format: "uri", description: "Enlace de salida a la tienda" },
          imageUrl: { type: "string", format: "uri" },
          price: money,
          originalPrice: { ...money, description: "Precio antes del descuento" },
          discountPercent: { type: "integer" },
          currency: { type: "string", enum: ["MXN"] },
          available: { type: "boolean" },
          condition: { type: "string", enum: ["new"] },
          installments: { type: "array", items: ref("Installment") },
          identifiers: {
            type: "object",
            properties: {
              gtin: { type: "string", description: "GTIN normalizado a 14 dígitos" },
              brand: { type: "string" },
              model: { type: "string" },
              sku: { type: "string" },
            },
          },
          fetchedAt: { type: "string", format: "date-time" },
        },
      },
      ProductGroup: {
        type: "object",
        required: [
          "id",
          "title",
          "lowestPrice",
          "highestPrice",
          "offerCount",
          "matchedBy",
          "offers",
        ],
        properties: {
          id: { type: "string", examples: ["gtin:00846042073158"] },
          title: { type: "string" },
          brand: { type: "string" },
          model: { type: "string" },
          imageUrl: { type: "string", format: "uri" },
          lowestPrice: money,
          highestPrice: money,
          offerCount: { type: "integer" },
          matchedBy: {
            type: "string",
            enum: ["gtin", "model", "title", "single"],
            description: "Nivel con el que se agruparon las ofertas",
          },
          offers: {
            type: "array",
            description: "Con stock primero, luego por precio ascendente",
            items: ref("Offer"),
          },
        },
      },
      StoreStatus: {
        type: "object",
        required: ["id", "status", "count", "durationMs"],
        properties: {
          id: { type: "string" },
          status: {
            type: "string",
            enum: ["ok", "timeout", "error", "paused"],
            description:
              "`paused`: falló varias veces seguidas y se dejó de consultar unos minutos",
          },
          count: { type: "integer" },
          durationMs: { type: "integer" },
        },
      },
      SearchResponse: {
        type: "object",
        required: ["query", "fetchedAt", "groups", "stores", "nextCursor"],
        properties: {
          query: { type: "string" },
          fetchedAt: { type: "string", format: "date-time" },
          groups: { type: "array", items: ref("ProductGroup") },
          stores: { type: "array", items: ref("StoreStatus") },
          nextCursor: { type: ["string", "null"], description: "null = no hay más resultados" },
        },
      },
      StoresResponse: {
        type: "object",
        required: ["stores"],
        properties: { stores: { type: "array", items: ref("Store") } },
      },
      HealthResponse: {
        type: "object",
        required: ["status", "service", "uptimeSeconds", "timestamp"],
        properties: {
          status: { type: "string", enum: ["ok"] },
          service: { type: "string" },
          uptimeSeconds: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "string",
            enum: [
              "invalid_request",
              "invalid_cursor",
              "all_stores_failed",
              "not_found",
              "internal_error",
            ],
          },
          details: { type: "array", items: { type: "string" } },
          stores: { type: "array", items: ref("StoreStatus") },
        },
      },
    },
  },
} as const;
