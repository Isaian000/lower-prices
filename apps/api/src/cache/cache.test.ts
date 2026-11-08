import { describe, expect, it } from "vitest";

import type { Env } from "../config/env.js";
import { createCacheFromEnv } from "./index.js";
import { createMemoryCache } from "./memory.js";
import { createUpstashCache } from "./upstash.js";

describe("createMemoryCache", () => {
  it("guarda y vence las entradas", async () => {
    let time = 0;
    const cache = createMemoryCache(10, () => time);

    await cache.set("k", { a: 1 }, 60);
    expect(await cache.get("k")).toEqual({ a: 1 });

    time = 61_000;
    expect(await cache.get("k")).toBeUndefined();
  });

  it("descarta la entrada usada hace más tiempo al llegar al límite", async () => {
    const cache = createMemoryCache(2);
    await cache.set("a", 1, 60);
    await cache.set("b", 2, 60);
    await cache.get("a"); // "a" pasa a ser la más reciente
    await cache.set("c", 3, 60);

    expect(await cache.get("a")).toBe(1);
    expect(await cache.get("b")).toBeUndefined();
    expect(await cache.get("c")).toBe(3);
  });
});

describe("createUpstashCache", () => {
  it("usa la API REST con los comandos GET y SET", async () => {
    const bodies: unknown[] = [];
    const fakeFetch: typeof fetch = async (_url, init) => {
      const command = JSON.parse(String(init?.body)) as string[];
      bodies.push(command);
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer secreto");
      const result = command[0] === "GET" ? JSON.stringify({ a: 1 }) : "OK";
      return Response.json({ result });
    };
    const cache = createUpstashCache({
      url: "https://x.upstash.io",
      token: "secreto",
      fetch: fakeFetch,
    });

    await cache.set("k", { a: 1 }, 600);
    expect(await cache.get("k")).toEqual({ a: 1 });
    expect(bodies).toEqual([
      ["SET", "k", '{"a":1}', "EX", 600],
      ["GET", "k"],
    ]);
  });

  it("devuelve undefined si la clave no existe", async () => {
    const fakeFetch: typeof fetch = async () => Response.json({ result: null });
    const cache = createUpstashCache({ url: "https://x.upstash.io", token: "t", fetch: fakeFetch });

    expect(await cache.get("k")).toBeUndefined();
  });

  it("falla con un error claro si Upstash responde con error HTTP o en el cuerpo", async () => {
    const httpError = createUpstashCache({
      url: "https://x.upstash.io",
      token: "t",
      fetch: async () => new Response("", { status: 401 }),
    });
    const bodyError = createUpstashCache({
      url: "https://x.upstash.io",
      token: "t",
      fetch: async () => Response.json({ error: "WRONGPASS invalid password" }),
    });

    await expect(httpError.get("k")).rejects.toThrow("Upstash respondió 401");
    await expect(bodyError.set("k", 1, 60)).rejects.toThrow("Upstash: WRONGPASS");
  });

  it("no espera más que el tiempo límite", async () => {
    const slow: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });
    const cache = createUpstashCache({
      url: "https://x.upstash.io",
      token: "t",
      timeoutMs: 20,
      fetch: slow,
    });

    await expect(cache.get("k")).rejects.toThrow();
  });
});

describe("createCacheFromEnv", () => {
  const env = (vars: Partial<Env>) => vars as Env;

  it("usa memoria si no hay credenciales", () => {
    expect(createCacheFromEnv(env({})).kind).toBe("memory");
    expect(createCacheFromEnv(env({ KV_REST_API_URL: "https://x.upstash.io" })).kind).toBe(
      "memory",
    );
  });

  it("usa Upstash con las variables de Upstash o con las que crea Vercel", () => {
    expect(
      createCacheFromEnv(
        env({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" }),
      ).kind,
    ).toBe("upstash");
    expect(
      createCacheFromEnv(env({ KV_REST_API_URL: "https://x.upstash.io", KV_REST_API_TOKEN: "t" }))
        .kind,
    ).toBe("upstash");
  });
});
