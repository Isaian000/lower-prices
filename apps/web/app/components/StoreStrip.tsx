import type { Store, StoreStatus } from "@lower-prices/shared";
import { useTranslation } from "react-i18next";

import { StoreLamp } from "./StoreLamp";
import styles from "./StoreStrip.module.css";

/**
 * Estado de las tiendas consultadas. Muestra un resumen de una línea («4 de 4 tiendas
 * respondieron») y el detalle de cada tienda en un desplegable, para que funcione igual
 * con 4 o con 20 tiendas. Si alguna falló, el detalle se abre solo.
 */
export function StoreStrip({
  stores,
  statuses,
}: {
  stores: readonly Store[];
  statuses: readonly StoreStatus[];
}) {
  const { t } = useTranslation("search");
  const byId = new Map(statuses.map((status) => [status.id, status]));
  const answered = statuses.filter((status) => status.status === "ok").length;
  const allOk = answered === statuses.length;

  return (
    <details className={styles.status} open={!allOk}>
      <summary className={styles.summary}>
        <StoreLamp state={allOk ? "ok" : "timeout"} />
        <span>{t("stores.summary", { answered, count: statuses.length })}</span>
      </summary>
      <ul className={styles.list} aria-label={t("stores.heading")}>
        {stores.map((store) => {
          const status = byId.get(store.id);
          const state = status?.status ?? "idle";
          return (
            <li key={store.id} className={styles.item} data-state={state}>
              <StoreLamp state={state} />
              <span className={styles.name}>{store.name}</span>
              {status && (
                <span className={styles.detail}>
                  {status.status === "ok"
                    ? t("stores.ok", { count: status.count })
                    : t(`stores.${status.status}`)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/**
 * Tiendas que faltan en los resultados, separadas por motivo para que el aviso diga
 * lo mismo que el detalle: no respondieron (tiempo o error) o están en pausa.
 */
export function missingStores(stores: readonly Store[], statuses: readonly StoreStatus[]) {
  const names = (codes: readonly StoreStatus["status"][]) => {
    const ids = new Set(statuses.filter((s) => codes.includes(s.status)).map((s) => s.id));
    return stores.filter((store) => ids.has(store.id)).map((store) => store.name);
  };
  return { unresponsive: names(["timeout", "error"]), paused: names(["paused"]) };
}
