import { Router } from "express";

import { openApiDocument } from "../openapi.js";

export const openApiRouter = Router();

openApiRouter.get("/openapi.json", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json(openApiDocument);
});
