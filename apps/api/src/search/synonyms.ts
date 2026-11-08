/**
 * Sinónimos para el filtro de relevancia. Las tiendas nombran lo mismo de formas
 * distintas ("Laptop HP" vs. "Computadora portátil Dell"), y sin esto el filtro
 * descartaría resultados válidos.
 *
 * Cada grupo tiene:
 * - `same`: términos equivalentes; buscar cualquiera acepta todos los demás.
 * - `also`: coincidencias en un solo sentido; buscar un término de `same` también
 *   acepta estas palabras, pero buscarlas a ellas no trae el grupo. Así "celular"
 *   trae iPhones, pero "iphone" no trae otros celulares.
 *
 * Todo va en minúsculas, sin acentos y en singular (como lo deja `stem`), y una frase
 * es un solo término. Las palabras se comparan por inicio de palabra en el nombre del
 * producto: "audifono" acepta "audífonos", y "hero" acepta "HERO13" pero no "superhero".
 */
interface SynonymGroup {
  same: readonly string[];
  also?: readonly string[];
}

const GROUPS: readonly SynonymGroup[] = [
  { same: ["laptop", "notebook", "computadora portatil"], also: ["macbook", "chromebook"] },
  {
    same: ["celular", "smartphone", "telefono celular", "telefono movil"],
    also: ["iphone"],
  },
  { same: ["television", "televisor", "pantalla", "smart tv", "tv"] },
  { same: ["audifono", "auricular", "headphone", "earbud"], also: ["airpod"] },
  { same: ["bocina", "altavoz", "parlante", "speaker"] },
  { same: ["camara", "camera", "videocamara"], also: ["webcam", "hero"] },
  { same: ["tableta", "tablet"], also: ["ipad"] },
  { same: ["reloj inteligente", "smartwatch"], also: ["apple watch"] },
  { same: ["consola", "videoconsola"], also: ["playstation", "xbox", "nintendo switch"] },
  // Sin "refri": como inicio de palabra también acepta "refrigerable" o "refrigeración".
  { same: ["refrigerador", "nevera"], also: ["frigobar"] },
  { same: ["tenis", "sneaker"] },
  { same: ["playera", "camiseta"] },
  { same: ["chamarra", "chaqueta", "jacket"] },
  { same: ["mochila", "backpack"] },
];

/** Término buscado → palabras que también lo satisfacen (sin incluirse a sí mismo). */
const ALTERNATIVES: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of GROUPS) {
    for (const term of group.same) {
      const others = [...group.same, ...(group.also ?? [])].filter((other) => other !== term);
      map.set(term, [...(map.get(term) ?? []), ...others]);
    }
  }
  return map;
})();

/** Frases de varias palabras que deben tratarse como un solo término de búsqueda. */
export const SYNONYM_PHRASES: readonly string[] = [...ALTERNATIVES.keys()]
  .filter((term) => term.includes(" "))
  .toSorted((a, b) => b.split(" ").length - a.split(" ").length);

export function alternativesFor(term: string): readonly string[] {
  return ALTERNATIVES.get(term) ?? [];
}
