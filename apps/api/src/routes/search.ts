import type { ApiErrorResponse, SearchSort, StoresResponse } from "@lower-prices/shared";
import { Router } from "express";
import { z } from "zod";

import { InvalidCursorError } from "../search/cursor.js";
import { AllStoresFailedError, type SearchService } from "../search/service.js";

const SORTS = ["relevance", "price_asc", "price_desc"] as const satisfies readonly SearchSort[];

const price = z.coerce.number().min(0).max(10_000_000).optional();

const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100),
    cursor: z.string().max(2000).optional(),
    sort: z.enum(SORTS).default("relevance"),
    stores: z
      .string()
      .optional()
      .transform((value) =>
        value
          ?.split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    minPrice: price,
    maxPrice: price,
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      query.minPrice <= query.maxPrice,
    { message: "minPrice no puede ser mayor que maxPrice", path: ["minPrice"] },
  );

/** Respuestas completas se cachean en el CDN; las parciales no, para reintentar pronto. */
const CDN_CACHE = "public, max-age=0, s-maxage=300, stale-while-revalidate=600";

export function createSearchRouter(service: SearchService): Router {
  const router = Router();

  router.get("/search", async (req, res) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const body: ApiErrorResponse = {
        error: "invalid_request",
        details: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      };
      res.status(400).json(body);
      return;
    }

    const known = new Set(service.stores().map((store) => store.id));
    const unknown = parsed.data.stores?.filter((id) => !known.has(id)) ?? [];
    if (unknown.length > 0) {
      const body: ApiErrorResponse = {
        error: "invalid_request",
        details: [`stores: tiendas desconocidas (${unknown.join(", ")})`],
      };
      res.status(400).json(body);
      return;
    }

    try {
      const { q, ...rest } = parsed.data;
      const result = await service.search({ query: q, ...rest });
      const complete = result.stores.every((store) => store.status === "ok");
      res.set("Cache-Control", complete ? CDN_CACHE : "no-store");
      res.json(result);
    } catch (error) {
      if (error instanceof InvalidCursorError) {
        const body: ApiErrorResponse = { error: "invalid_cursor" };
        res.status(400).json(body);
        return;
      }
      if (error instanceof AllStoresFailedError) {
        const body: ApiErrorResponse = { error: "all_stores_failed", stores: error.stores };
        res.set("Cache-Control", "no-store");
        res.status(500).json(body);
        return;
      }
      throw error;
    }
  });

  router.get("/stores", (_req, res) => {
    const body: StoresResponse = { stores: service.stores() };
    res.set("Cache-Control", "public, max-age=3600");
    res.json(body);
  });

  return router;
}
