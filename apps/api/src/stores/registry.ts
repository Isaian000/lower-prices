import type { StoreAdapter } from "./types.js";
import { createVtexAdapter, type VtexStoreConfig } from "./vtex/adapter.js";

/**
 * Tiendas con API pública de catálogo VTEX (investigación del 2026-11-06, ver README).
 * Para sumar otra tienda VTEX basta con agregarla aquí.
 */
export const VTEX_STORES: readonly VtexStoreConfig[] = [
  { id: "elektra", name: "Elektra", baseUrl: "https://www.elektra.mx" },
  { id: "chedraui", name: "Chedraui", baseUrl: "https://www.chedraui.com.mx" },
  { id: "officemax", name: "OfficeMax", baseUrl: "https://www.officemax.com.mx" },
  { id: "marti", name: "Martí", baseUrl: "https://www.marti.mx" },
];

export function createDefaultAdapters(): StoreAdapter[] {
  return VTEX_STORES.map((config) => createVtexAdapter(config));
}
