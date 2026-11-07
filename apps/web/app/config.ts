// Nombre provisional del producto (D-22). Cambiarlo aquí lo cambia en todo el sitio.
export const APP_NAME = "lower-prices";

/** Idioma por defecto y único por ahora (D-23). */
export const DEFAULT_LOCALE = "es-MX";

export const SUPPORTED_LOCALES = [DEFAULT_LOCALE] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
