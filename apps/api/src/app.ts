import type { ApiErrorResponse } from "@lower-prices/shared";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { createCacheFromEnv } from "./cache/index.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";
import { openApiRouter } from "./routes/openapi.js";
import { createSearchRouter } from "./routes/search.js";
import { createCircuitBreaker } from "./search/circuit-breaker.js";
import { createSearchService, type SearchService } from "./search/service.js";
import { createDefaultAdapters } from "./stores/registry.js";

export interface AppDeps {
  /** Las pruebas inyectan un servicio con tiendas mock. */
  searchService?: SearchService;
  corsOrigins?: readonly string[];
}

function createDefaultSearchService(): SearchService {
  return createSearchService({
    adapters: createDefaultAdapters(),
    cache: createCacheFromEnv(env),
    timeoutMs: env.STORE_TIMEOUT_MS,
    pageSize: env.STORE_PAGE_SIZE,
    cacheTtlSeconds: env.CACHE_TTL_SECONDS,
    circuitBreaker: createCircuitBreaker({
      threshold: env.STORE_FAILURE_THRESHOLD,
      cooldownMs: env.STORE_PAUSE_SECONDS * 1000,
    }),
    logger,
  });
}

/**
 * Crea la app de Express sin llamar a listen(), para poder servirla
 * tanto en un servidor Node (VPS) como en una función serverless (Vercel). Ver RNF-11.
 */
export function createApp(deps: AppDeps = {}) {
  const app = express();
  const searchService = deps.searchService ?? createDefaultSearchService();
  const corsOrigins = deps.corsOrigins ?? env.CORS_ORIGINS;

  app.disable("x-powered-by");
  app.use(pinoHttp({ logger }));
  // Cabeceras de seguridad. La API solo devuelve JSON, así que la CSP puede ser la más estricta.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
    }),
  );
  // Solo GET desde los orígenes permitidos; sin cookies.
  app.use(cors({ origin: [...corsOrigins], methods: ["GET"], maxAge: 86_400 }));
  app.use(express.json({ limit: "10kb" }));

  app.use("/api/health", healthRouter);
  app.use("/api", openApiRouter);
  app.use("/api", createSearchRouter(searchService));

  app.use((_req, res) => {
    const body: ApiErrorResponse = { error: "not_found" };
    res.status(404).json(body);
  });

  const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    req.log.error({ err }, "Error no controlado");
    const body: ApiErrorResponse = { error: "internal_error" };
    res.status(500).json(body);
  };
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
