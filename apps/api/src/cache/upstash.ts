import type { Cache } from "./types.js";

export interface UpstashConfig {
  url: string;
  token: string;
  /** La caché no debe frenar la búsqueda: si tarda más, se ignora. */
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/**
 * Caché en Upstash Redis usando su API REST (funciona en serverless, sin conexiones abiertas).
 * Docs: https://upstash.com/docs/redis/features/restapi
 */
export function createUpstashCache(config: UpstashConfig): Cache {
  const doFetch = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 500;

  async function command(args: (string | number)[]): Promise<unknown> {
    const response = await doFetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`Upstash respondió ${response.status}`);
    const body = (await response.json()) as { result?: unknown; error?: string };
    if (body.error) throw new Error(`Upstash: ${body.error}`);
    return body.result;
  }

  return {
    kind: "upstash",

    async get<T>(key: string): Promise<T | undefined> {
      const result = await command(["GET", key]);
      return typeof result === "string" ? (JSON.parse(result) as T) : undefined;
    },

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
      await command(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
    },
  };
}
