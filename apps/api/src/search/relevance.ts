import type { Offer } from "@lower-prices/shared";

import { stripAccents } from "../lib/product.js";

/** Palabras de la búsqueda que no ayudan a decidir si un producto coincide. */
const QUERY_STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "con",
  "para",
  "y",
  "en",
  "a",
  "o",
  "un",
  "una",
  "por",
]);

/** Minúsculas, sin acentos y solo letras y números, todo pegado ("WH-1000XM5" → "wh1000xm5"). */
function compact(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Singular aproximado: "audifonos" → "audifono", "pantallas" → "pantalla", "leds" → "led". */
function stem(token: string): string {
  if (token.length > 5 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

/** Palabras significativas de la búsqueda, ya normalizadas. */
export function queryTerms(query: string): string[] {
  return stripAccents(query)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0 && !QUERY_STOPWORDS.has(token))
    .filter((token) => token.length >= 2 || /\d/.test(token))
    .map(stem);
}

/** Cuántas palabras deben aparecer: todas si son 1 o 2; el 60 % (redondeado arriba) si son más. */
function required(count: number): number {
  return count <= 2 ? count : Math.ceil(count * 0.6);
}

/**
 * true si la oferta corresponde a la búsqueda. Se busca cada palabra dentro del nombre,
 * la marca y el modelo juntos y sin separadores, así "1000xm5" coincide con "WH-1000XM5"
 * y "pantalla" con "Pantallas".
 */
export function isRelevant(offer: Offer, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = compact(
    [offer.title, offer.identifiers?.brand ?? "", offer.identifiers?.model ?? ""].join(" "),
  );
  const hits = terms.filter((term) => haystack.includes(term)).length;
  return hits >= required(terms.length);
}

/**
 * Quita ofertas que la tienda devolvió pero no corresponden a lo buscado: las tiendas
 * de un solo giro o de marca (p. ej. Levi's al buscar "pantalla") y accesorios que solo
 * comparten una palabra con la búsqueda.
 */
export function filterRelevant(offers: readonly Offer[], query: string): Offer[] {
  const terms = queryTerms(query);
  return offers.filter((offer) => isRelevant(offer, terms));
}

/** Palabras con las que empiezan los nombres de accesorios. */
const ACCESSORY_WORDS = new Set([
  "funda",
  "fundas",
  "mica",
  "micas",
  "protector",
  "estuche",
  "cartera",
  "carcasa",
  "case",
  "cargador",
  "cable",
  "soporte",
  "base",
  "correa",
  "control",
  "repuesto",
  "refaccion",
  "adaptador",
  "bateria",
  "skin",
]);

/**
 * true si la oferta parece un accesorio que no se buscó: su nombre empieza (en las dos
 * primeras palabras, por si va la marca antes) con una palabra de accesorio que no está
 * en la búsqueda. «Funda para iPhone 16» al buscar «iphone 16» es un accesorio;
 * al buscar «funda iphone 16» no lo es.
 */
export function isUnsoughtAccessory(offer: Offer, terms: readonly string[]): boolean {
  const lead = stripAccents(offer.title)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);
  return lead.some((word) => ACCESSORY_WORDS.has(word) && !terms.includes(stem(word)));
}
