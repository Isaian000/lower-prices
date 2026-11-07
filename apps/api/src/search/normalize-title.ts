import { stripAccents } from "../lib/product.js";

/** Palabras que no ayudan a distinguir un producto de otro. */
const STOPWORDS = new Set([
  // Relleno comercial
  "envio",
  "gratis",
  "original",
  "nuevo",
  "nueva",
  "oferta",
  "promocion",
  "garantia",
  "msi",
  // Conectores
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
  "mas",
  "mod",
  "modelo",
]);

/** Unidades que se pegan al número ("128 gb" → "128gb") y sus equivalencias. */
const UNIT_ALIASES: Record<string, string> = {
  pulgadas: "in",
  pulgada: "in",
  pulg: "in",
  pul: "in",
  '"': "in",
  in: "in",
  gb: "gb",
  tb: "tb",
  mb: "mb",
  mp: "mp",
  mah: "mah",
  w: "w",
  hz: "hz",
  ml: "ml",
  l: "l",
  lt: "l",
  litros: "l",
  kg: "kg",
  g: "g",
  gr: "g",
  gramos: "g",
};

const UNIT_PATTERN = new RegExp(
  `(\\d+(?:[.,]\\d+)?)\\s*(${Object.keys(UNIT_ALIASES)
    .toSorted((a, b) => b.length - a.length)
    .map((unit) => unit.replace(/"/, '\\"'))
    .join("|")})(?![a-z0-9])`,
  "g",
);

/** Título normalizado como conjunto de palabras útiles para comparar. */
export function titleTokens(title: string): Set<string> {
  const text = stripAccents(title)
    .toLowerCase()
    .replace(UNIT_PATTERN, (_match, amount: string, unit: string) => {
      return `${amount.replace(",", ".")}${UNIT_ALIASES[unit] ?? unit}`;
    });

  const tokens = text
    .split(/[^a-z0-9.]+/)
    .map((token) => token.replace(/^\.+|\.+$/g, ""))
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
  return new Set(tokens);
}

/** Coeficiente de Dice entre dos conjuntos: 1 = idénticos, 0 = nada en común. */
export function diceSimilarity(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return (2 * shared) / (a.size + b.size);
}
