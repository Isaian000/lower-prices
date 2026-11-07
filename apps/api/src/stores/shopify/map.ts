import type { Offer, Store } from "@lower-prices/shared";

import { looksNotNew, normalizeBrand, roundMoney } from "../../lib/product.js";
import type { UcpMoney, UcpProduct, UcpVariant } from "./schema.js";

/** Convierte unidades menores a pesos: 189900 → 1899. */
export function fromMinorUnits(money: UcpMoney): number {
  return roundMoney(money.amount / 100);
}

/** "gid://shopify/Product/8123" → "8123". */
export function shopifyNumericId(gid: string): string {
  return gid.split("/").at(-1) ?? gid;
}

function isAvailable(variant: UcpVariant): boolean {
  // Si la tienda no informa disponibilidad se asume disponible: search_catalog
  // filtra por omisión a productos listos para venta.
  return variant.availability?.available !== false;
}

/**
 * Elige la variante más barata con stock (tallas o colores del mismo producto) y,
 * si ninguna tiene, la más barata agotada. Solo se consideran precios en MXN.
 */
function chooseVariant(product: UcpProduct): UcpVariant | undefined {
  const priced = product.variants.filter(
    (variant) => variant.price.currency === "MXN" && variant.price.amount > 0,
  );
  const available = priced.filter(isAvailable);
  const pool = available.length > 0 ? available : priced;
  return pool.toSorted((a, b) => a.price.amount - b.price.amount)[0];
}

function firstImage(media: UcpProduct["media"]): string | undefined {
  return media?.find((item) => item.type === "image")?.url;
}

export interface ShopifyMapContext {
  store: Store;
  /** Origen de la tienda, para armar el enlace si el producto no trae `url`. */
  baseUrl: string;
  /** Marca de las tiendas oficiales (UCP no informa la marca de cada producto). */
  brand?: string | undefined;
  fetchedAt: string;
}

/**
 * Convierte un producto UCP en una oferta del modelo común.
 * Devuelve null si no tiene precio en MXN, si es tarjeta de regalo o si parece
 * usado o reacondicionado (RF-09).
 */
export function mapUcpProduct(product: UcpProduct, context: ShopifyMapContext): Offer | null {
  const { store, baseUrl, fetchedAt } = context;
  const title = product.title.trim();
  if (!title || product.gift_card || looksNotNew(title)) return null;

  const variant = chooseVariant(product);
  if (!variant) return null;

  const price = fromMinorUnits(variant.price);
  const listPrice =
    variant.list_price?.currency === "MXN" ? fromMinorUnits(variant.list_price) : undefined;
  const hasDiscount = listPrice !== undefined && listPrice > price;

  const url =
    product.url ?? (product.handle ? new URL(`/products/${product.handle}`, baseUrl).href : null);
  if (!url) return null;

  const imageUrl = firstImage(variant.media) ?? firstImage(product.media);
  const brand = normalizeBrand(context.brand);

  return {
    id: `${store.id}:${shopifyNumericId(product.id)}`,
    store,
    title,
    url,
    ...(imageUrl ? { imageUrl } : {}),
    price,
    ...(hasDiscount
      ? {
          originalPrice: listPrice,
          discountPercent: Math.round((1 - price / listPrice) * 100),
        }
      : {}),
    currency: "MXN",
    available: isAvailable(variant),
    condition: "new",
    // UCP no publica meses sin intereses en el catálogo.
    installments: [],
    identifiers: {
      ...(brand ? { brand } : {}),
      ...(variant.sku ? { sku: variant.sku } : {}),
    },
    fetchedAt,
  };
}
