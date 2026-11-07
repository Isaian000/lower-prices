import { Router } from "express";

import { ucpAgentProfile } from "../stores/shopify/profile.js";

export const ucpRouter = Router();

ucpRouter.get("/ucp", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600").json(ucpAgentProfile);
});
