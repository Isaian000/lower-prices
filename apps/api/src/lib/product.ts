// Utilidades de normalización de datos de producto, compartidas por los adaptadores y el agrupador.

/** Marcas que en realidad no identifican al fabricante. */
const GENERIC_BRANDS = new Set([
  "generica",
  "generico",
  "generic",
  "sinmarca",
  "otros",
  "otra",
  "na",
]);

/** Modelos de relleno que no sirven para comparar. */
const PLACEHOLDER_MODELS = new Set(["na", "sinmodelo", "nd", "generico", "generica", "0"]);

/** Palabras que indican producto usado o reacondicionado (RF-09). */
const NOT_NEW_PATTERN =
  /\b(reacondicionad[oa]s?|seminuev[oa]s?|usad[oa]s?|refurbished|renewed|open box)\b/i;

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Minúsculas, sin acentos y solo letras y números. */
export function compactKey(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Verifica el dígito de control GS1 de un GTIN de 14 dígitos. */
function hasValidCheckDigit(gtin14: string): boolean {
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += Number(gtin14[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(gtin14[13]);
}

/**
 * Normaliza un GTIN (EAN-8, UPC-12, EAN-13 o GTIN-14) a 14 dígitos.
 * Así "0050036416986" y "50036416986" son el mismo código.
 * Descarta códigos con dígito de control inválido: algunas tiendas publican EAN
 * truncados y agruparlos daría coincidencias falsas.
 */
export function normalizeGtin(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) return undefined;
  if (/^0+$/.test(digits)) return undefined;
  const gtin = digits.padStart(14, "0");
  return hasValidCheckDigit(gtin) ? gtin : undefined;
}

/** Devuelve la marca limpia, o undefined si es una marca genérica. */
export function normalizeBrand(value: string | null | undefined): string | undefined {
  const brand = value?.trim();
  if (!brand) return undefined;
  if (GENERIC_BRANDS.has(compactKey(brand))) return undefined;
  return brand;
}

/**
 * Devuelve el modelo limpio, o undefined si no aporta información.
 * Exige al menos un dígito: los modelos reales casi siempre lo tienen (WH-1000XM5,
 * 55S453), y así se descartan textos como "Mando a distancia universal".
 */
export function normalizeModel(value: string | null | undefined): string | undefined {
  const model = value?.trim();
  if (!model) return undefined;
  const key = compactKey(model);
  if (key.length < 3 || key.length > 30 || PLACEHOLDER_MODELS.has(key)) return undefined;
  if (!/\d/.test(key)) return undefined;
  return model;
}

export function looksNotNew(title: string): boolean {
  return NOT_NEW_PATTERN.test(stripAccents(title));
}

/** Redondea a centavos para evitar errores de punto flotante. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
