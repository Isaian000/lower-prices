import type { Installment, Offer, Store } from "@lower-prices/shared";

import {
  looksNotNew,
  normalizeBrand,
  normalizeGtin,
  normalizeModel,
  roundMoney,
} from "../../lib/product.js";
import type { VtexInstallment, VtexItem, VtexProduct, VtexSeller } from "./schema.js";

interface PricedChoice {
  item: VtexItem;
  seller: VtexSeller;
  available: boolean;
}

function isAvailable(seller: VtexSeller): boolean {
  const offer = seller.commertialOffer;
  return offer.Price > 0 && offer.AvailableQuantity > 0 && offer.IsAvailable !== false;
}

/**
 * Elige el vendedor de un SKU: el vendedor por defecto si tiene stock, si no el
 * más barato con stock y, como último recurso, cualquiera con precio (agotado).
 * VTEX suele listar al vendedor "1" con precio 0 cuando el producto es de marketplace.
 */
function chooseSeller(item: VtexItem): PricedChoice | undefined {
  const priced = item.sellers.filter((seller) => seller.commertialOffer.Price > 0);
  const available = priced.filter(isAvailable);

  const preferred =
    available.find((seller) => seller.sellerDefault) ??
    available.toSorted((a, b) => a.commertialOffer.Price - b.commertialOffer.Price)[0];
  if (preferred) return { item, seller: preferred, available: true };

  const fallback = priced.find((seller) => seller.sellerDefault) ?? priced[0];
  return fallback ? { item, seller: fallback, available: false } : undefined;
}

/** Elige el SKU más barato con stock (p. ej. entre tallas o colores del mismo producto). */
function chooseItem(product: VtexProduct): PricedChoice | undefined {
  const choices = product.items
    .map(chooseSeller)
    .filter((choice): choice is PricedChoice => choice !== undefined);

  const available = choices.filter((choice) => choice.available);
  const pool = available.length > 0 ? available : choices;
  return pool.toSorted(
    (a, b) => a.seller.commertialOffer.Price - b.seller.commertialOffer.Price,
  )[0];
}

/**
 * Convierte los pagos de VTEX en meses sin intereses (RF-10).
 * Solo cuenta un plan si tiene tasa 0 y el total no supera el precio de contado.
 * Si varios medios de pago ofrecen los mismos meses, se queda el pago mensual más bajo.
 */
export function mapInstallments(
  installments: readonly VtexInstallment[] | null | undefined,
  price: number,
): Installment[] {
  const byMonths = new Map<number, number>();

  for (const plan of installments ?? []) {
    const months = plan.NumberOfInstallments;
    const interestFree = plan.InterestRate === 0 && plan.TotalValuePlusInterestRate <= price + 0.01;
    if (months <= 1 || !interestFree || plan.Value <= 0) continue;

    const current = byMonths.get(months);
    if (current === undefined || plan.Value < current) byMonths.set(months, plan.Value);
  }

  return [...byMonths.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([months, amount]) => ({ months, amount: roundMoney(amount), interestFree: true }));
}

function toHttps(url: string): string {
  return url.replace(/^http:\/\//, "https://");
}

/**
 * Convierte un producto VTEX en una oferta del modelo común.
 * Devuelve null si no tiene precio o si parece usado o reacondicionado (RF-09).
 */
export function mapVtexProduct(
  product: VtexProduct,
  store: Store,
  fetchedAt: string,
): Offer | null {
  const title = product.productName.trim();
  if (!title || looksNotNew(title)) return null;

  const choice = chooseItem(product);
  if (!choice) return null;

  const { item, seller, available } = choice;
  const commercial = seller.commertialOffer;
  const price = roundMoney(commercial.Price);
  const listPrice = commercial.ListPrice ? roundMoney(commercial.ListPrice) : undefined;
  const hasDiscount = listPrice !== undefined && listPrice > price;

  const gtin = normalizeGtin(item.ean);
  const brand = normalizeBrand(product.brand);
  const model = normalizeModel(product.Modelo?.[0]);
  const imageUrl = item.images?.[0]?.imageUrl;

  return {
    id: `${store.id}:${product.productId}`,
    store,
    title,
    url: toHttps(product.link),
    ...(imageUrl ? { imageUrl: toHttps(imageUrl) } : {}),
    price,
    ...(hasDiscount
      ? {
          originalPrice: listPrice,
          discountPercent: Math.round((1 - price / listPrice) * 100),
        }
      : {}),
    currency: "MXN",
    available,
    condition: "new",
    installments: mapInstallments(commercial.Installments, price),
    identifiers: {
      ...(gtin ? { gtin } : {}),
      ...(brand ? { brand } : {}),
      ...(model ? { model } : {}),
      sku: item.itemId,
    },
    fetchedAt,
  };
}
