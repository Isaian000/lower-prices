import type { HealthResponse } from "@lower-prices/shared";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

describe("API", () => {
  const app = createApp();

  it("GET /api/health responde ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    const body = res.body as HealthResponse;
    expect(body.status).toBe("ok");
    expect(body.service).toBe("api");
    expect(typeof body.uptimeSeconds).toBe("number");
  });

  it("responde 404 en JSON para rutas desconocidas", async () => {
    const res = await request(app).get("/api/no-existe");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "not_found" });
  });

  it("no expone la cabecera x-powered-by", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
