import type { Offer } from "@lower-prices/shared";

import { stripAccents } from "../lib/product.js";
import { alternativesFor, SYNONYM_PHRASES } from "./synonyms.js";

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

/** Palabras sueltas de un texto: minúsculas, sin acentos, solo letras y números. */
function words(value: string): string[] {
  return stripAccents(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Palabras significativas de la búsqueda, ya normalizadas. Las frases con sinónimo
 * ("computadora portatil") quedan como un solo término.
 */
export function queryTerms(query: string): string[] {
  const tokens = words(query)
    .filter((token) => !QUERY_STOPWORDS.has(token))
    .filter((token) => token.length >= 2 || /\d/.test(token))
    .map(stem);

  let joined = ` ${tokens.join(" ")} `;
  const phrases: string[] = [];
  for (const phrase of SYNONYM_PHRASES) {
    if (joined.includes(` ${phrase} `)) {
      phrases.push(phrase);
      joined = joined.replace(` ${phrase} `, " ");
    }
  }
  return [...phrases, ...joined.split(" ").filter(Boolean)];
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
/**
 * Devuelve una función que dice si un término de la búsqueda aparece en el texto: el
 * término tal cual (todo pegado, así "1000xm5" coincide con "WH-1000XM5") o alguno de
 * sus sinónimos al inicio de una palabra ("hero" acepta "HERO13", no "superhero").
 */
function termMatcher(text: string): (term: string) => boolean {
  const haystack = compact(text);
  const wordStarts = ` ${words(text).join(" ")}`;
  return (term) =>
    haystack.includes(term.replaceAll(" ", "")) ||
    alternativesFor(term).some((alternative) => wordStarts.includes(` ${alternative}`));
}

export function isRelevant(offer: Offer, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const matches = termMatcher(
    [offer.title, offer.identifiers?.brand ?? "", offer.identifiers?.model ?? ""].join(" "),
  );
  return terms.filter(matches).length >= required(terms.length);
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
  "mochila",
  "backpack",
  "maletin",
  "tripode",
  "porta",
  "colgante",
]);

/**
 * true si la oferta parece un accesorio que no se buscó. Dos señales:
 * - El nombre empieza (en las dos primeras palabras, por si va la marca antes) con una
 *   palabra de accesorio que no está en la búsqueda. «Funda para iPhone 16» al buscar
 *   «iphone 16» es un accesorio; al buscar «funda iphone 16» no lo es.
 * - Lo buscado solo aparece después de "para": «Anillo para celular» o «Mochila para
 *   laptop» al buscar «celular» o «laptop».
 */
export function isUnsoughtAccessory(offer: Offer, terms: readonly string[]): boolean {
  if (terms.length === 0) return false;
  const titleWords = words(offer.title);

  // Se busca si la palabra o un sinónimo suyo está en la búsqueda ("backpack" = "mochila").
  const sought = new Set(terms.flatMap((term) => [term, ...alternativesFor(term)]));
  const lead = titleWords.slice(0, 2);
  if (lead.some((word) => ACCESSORY_WORDS.has(word) && !sought.has(stem(word)))) return true;

  const para = titleWords.indexOf("para");
  if (para <= 0) return false;
  const beforePara = termMatcher(titleWords.slice(0, para).join(" "));
  return !terms.some(beforePara);
}
