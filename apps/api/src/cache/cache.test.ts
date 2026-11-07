import { describe, expect, it } from "vitest";

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
});
