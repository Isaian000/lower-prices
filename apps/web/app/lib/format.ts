import { DEFAULT_LOCALE } from "~/config";

// Formatos dependientes del idioma (RNF-12). Nunca formatear precios o fechas a mano.

export function formatPrice(amount: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Precio para el tablero: sin centavos cuando son cero ($5,990), con centavos si los hay ($906.50). */
export function formatBoardPrice(amount: number, locale: string = DEFAULT_LOCALE): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amount);
}

export function formatDateTime(iso: string, locale: string = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: string = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(iso));
}
