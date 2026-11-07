// Tiendas y ofertas simuladas para las pruebas (no se usan en desarrollo ni producción).
import type { Offer, Store } from "@lower-prices/shared";

import type { StoreAdapter, StoreSearchParams } from "../stores/types.js";

let counter = 0;

export function makeStore(id: string): Store {
  return { id, name: id.toUpperCase() };
}

export function makeOffer(storeId: string, overrides: Partial<Offer> = {}): Offer {
  counter++;
  return {
    id: `${storeId}:${counter}`,
    store: makeStore(storeId),
    title: `Producto ${counter}`,
    url: `https://${storeId}.example/p/${counter}`,
    price: 1000,
    currency: "MXN",
    available: true,
    condition: "new",
    installments: [],
    fetchedAt: "2026-11-07T00:00:00.000Z",
    ...overrides,
  };
}

export interface MockStoreOptions {
  /** Catálogo completo; la búsqueda devuelve la "página" pedida. */
  offers?: Offer[];
  /** Simula una tienda lenta. Respeta el AbortSignal, como fetch. */
  delayMs?: number;
  /** Simula una tienda caída. */
  fail?: boolean;
}

export interface MockStore extends StoreAdapter {
  calls: StoreSearchParams[];
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

export function createMockStore(id: string, options: MockStoreOptions = {}): MockStore {
  const calls: StoreSearchParams[] = [];
  const offers = options.offers ?? [];

  return {
    store: makeStore(id),
    allowedHosts: [`${id}.example`],
    calls,
    async search(params) {
      calls.push(params);
      if (options.delayMs) await wait(options.delayMs, params.signal);
      if (options.fail) throw new Error(`${id} no disponible`);
      return {
        offers: offers.slice(params.offset, params.offset + params.limit),
        total: offers.length,
      };
    },
  };
}
