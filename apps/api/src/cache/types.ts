/** Caché clave → JSON con vencimiento. Un fallo de la caché nunca debe romper la búsqueda. */
export interface Cache {
  readonly kind: "memory" | "upstash";
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}
