import type { Offer } from "@lower-prices/shared";

/**
 * Reglas por tienda para modificar el enlace de salida, p. ej. agregar la etiqueta
 * de afiliado: `amazon: (url) => url.searchParams.set("tag", "mi-tag-20")`.
 * Hoy no hay ninguna: las tiendas VTEX no tienen programa de afiliados directo.
 */
export type OutboundRule = (url: URL) => void;
export const OUTBOUND_RULES: Readonly<Record<string, OutboundRule>> = {};

function hostMatches(host: string, allowed: string): boolean {
  const base = allowed.replace(/^www\./, "");
  return host === base || host.endsWith(`.${base}`);
}

/**
 * Único punto por donde pasan los enlaces a las tiendas (README, "Monetización").
 * Además valida el enlace: solo https y solo hacia el dominio de la tienda, para
 * no mostrar nunca un enlace a un sitio ajeno o un `javascript:`.
 * Devuelve undefined si el enlace no es válido.
 */
export function buildOutboundUrl(
  rawUrl: string,
  storeId: string,
  allowedHosts: readonly string[],
  rules: Readonly<Record<string, OutboundRule>> = OUTBOUND_RULES,
): string | undefined {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  if (allowedHosts.length > 0 && !allowedHosts.some((host) => hostMatches(url.hostname, host))) {
    return undefined;
  }
  rules[storeId]?.(url);
  return url.href;
}

/** Aplica buildOutboundUrl a las ofertas y descarta las de enlace inválido. */
export function withOutboundUrls(
  offers: readonly Offer[],
  allowedHosts: readonly string[],
  rules?: Readonly<Record<string, OutboundRule>>,
): Offer[] {
  return offers.flatMap((offer) => {
    const url = buildOutboundUrl(offer.url, offer.store.id, allowedHosts, rules);
    return url ? [{ ...offer, url }] : [];
  });
}
