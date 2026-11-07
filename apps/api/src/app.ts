import express, { type ErrorRequestHandler } from "express";
import { pinoHttp } from "pino-http";

import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";

/**
 * Crea la app de Express sin llamar a listen(), para poder servirla
 * tanto en un servidor Node (VPS) como en una función serverless (Vercel). Ver RNF-11.
 */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.use("/api/health", healthRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    req.log.error({ err }, "Error no controlado");
    res.status(500).json({ error: "internal_error" });
  };
  app.use(errorHandler);

  return app;
}

export const app = createApp();
