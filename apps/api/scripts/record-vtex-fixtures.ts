/**
 * Graba respuestas reales de las tiendas VTEX como fixtures para las pruebas.
 * Uso: pnpm --filter @lower-prices/api fixtures:record [id de tienda ...]
 * Sin ids graba todas; con ids, solo esas (así no se regraban las que usan las pruebas).
 *
 * Cada producto se pasa por el esquema de zod, que descarta los campos que el
 * adaptador no usa, para que los archivos sean pequeños y legibles.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { VTEX_STORES } from "../src/stores/registry.js";
import { buildVtexSearchUrl } from "../src/stores/vtex/adapter.js";
import { type VtexProduct, vtexProductSchema } from "../src/stores/vtex/schema.js";

/** Búsquedas por tienda: las tiendas de marca solo venden sus propios productos. */
const DEFAULT_QUERIES = ["audifonos", "pantalla tcl"];
const STORE_QUERIES: Record<string, string[]> = {
  whirlpool: ["lavadora"],
  oster: ["licuadora"],
  tfal: ["sarten"],
  sony: ["audifonos"],
  mixup: ["audifonos"],
  juguetron: ["lego"],
  similares: ["paracetamol"],
};
const only = new Set(process.argv.slice(2));
const LIMIT = 10;
const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/stores/vtex/__fixtures__",
);

/** Cada tarjeta repite los mismos planes; con uno por combinación basta para las pruebas. */
function dedupeInstallments(product: VtexProduct): VtexProduct {
  for (const item of product.items) {
    for (const seller of item.sellers) {
      const offer = seller.commertialOffer;
      const seen = new Set<string>();
      offer.Installments = offer.Installments?.filter((plan) => {
        const key = `${plan.NumberOfInstallments}|${plan.InterestRate}|${plan.Value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }
  return product;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

await mkdir(outDir, { recursive: true });

for (const store of VTEX_STORES.filter((s) => only.size === 0 || only.has(s.id))) {
  for (const query of STORE_QUERIES[store.id] ?? DEFAULT_QUERIES) {
    const url = buildVtexSearchUrl(store.baseUrl, {
      query,
      offset: 0,
      limit: LIMIT,
      sort: "relevance",
    });
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const body = (await response.json()) as unknown[];
    const products = body.flatMap((raw) => {
      const parsed = vtexProductSchema.safeParse(raw);
      return parsed.success ? [dedupeInstallments(parsed.data)] : [];
    });

    const fixture = {
      store: store.id,
      query,
      status: response.status,
      resources: response.headers.get("resources"),
      recordedAt: new Date().toISOString(),
      body: products,
    };
    const file = path.join(outDir, `${store.id}.${slug(query)}.json`);
    await writeFile(file, `${JSON.stringify(fixture, null, 2)}\n`);
    console.log(`${store.id} "${query}": ${products.length} productos → ${path.basename(file)}`);
  }
}
