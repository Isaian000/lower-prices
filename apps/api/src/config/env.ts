import { z } from "zod";

/** Cadena vacía = variable no definida (útil con archivos .env que dejan valores en blanco). */
const optionalString = z
  .string()
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  /** Tiempo máximo de espera por tienda (RNF-02). */
  STORE_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
  /** Resultados que se piden a cada tienda por bloque de "cargar más". */
  STORE_PAGE_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  /** Fallas seguidas de una tienda antes de pausarla. */
  STORE_FAILURE_THRESHOLD: z.coerce.number().int().min(1).default(3),
  /** Duración de la pausa de una tienda que falla. */
  STORE_PAUSE_SECONDS: z.coerce.number().int().min(1).default(60),
  /**
   * Orígenes que pueden llamar a la API desde el navegador, separados por coma.
   * La web llama desde su servidor (SSR), que no necesita CORS.
   */
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  /** Vida de la caché de resultados por tienda. */
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),
  /**
   * URL pública del perfil de agente UCP (la API lo sirve en /.well-known/ucp), p. ej.
   * "https://api.ejemplo.mx/.well-known/ucp". Sin ella no se consultan las tiendas Shopify,
   * porque cada tienda descarga el perfil para validar la consulta.
   */
  UCP_AGENT_PROFILE_URL: optionalString.pipe(z.url({ protocol: /^https$/ }).optional()),
  /** Si ambas están definidas se usa Upstash Redis; si no, caché en memoria. */
  UPSTASH_REDIS_REST_URL: optionalString.pipe(z.url().optional()),
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  /** Nombres que crea la integración de Upstash en el Marketplace de Vercel. */
  KV_REST_API_URL: optionalString.pipe(z.url().optional()),
  KV_REST_API_TOKEN: optionalString,
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env = loadEnv();
