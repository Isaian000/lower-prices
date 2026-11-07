import type { Cache } from "./types.js";

interface Entry {
  value: unknown;
  expiresAt: number;
}

/**
 * Caché en memoria del proceso, para desarrollo o un servidor único.
 * Al llegar al límite descarta la entrada usada hace más tiempo (LRU).
 */
export function createMemoryCache(maxEntries = 500, now: () => number = Date.now): Cache {
  const entries = new Map<string, Entry>();

  return {
    kind: "memory",

    async get<T>(key: string): Promise<T | undefined> {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }
      // Reinsertar la mueve al final: Map conserva el orden de inserción.
      entries.delete(key);
      entries.set(key, entry);
      return entry.value as T;
    },

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
      entries.delete(key);
      entries.set(key, { value, expiresAt: now() + ttlSeconds * 1000 });
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
  };
}
