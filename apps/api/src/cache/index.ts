import type { Env } from "../config/env.js";
import { createMemoryCache } from "./memory.js";
import type { Cache } from "./types.js";
import { createUpstashCache } from "./upstash.js";

export type { Cache } from "./types.js";

/** Upstash si hay credenciales (Vercel), si no memoria (desarrollo). */
export function createCacheFromEnv(env: Env): Cache {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (url && token) return createUpstashCache({ url, token });
  return createMemoryCache();
}
