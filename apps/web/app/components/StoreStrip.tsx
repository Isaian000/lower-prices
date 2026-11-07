import type { Store, StoreStatus } from "@lower-prices/shared";
import { useTranslation } from "react-i18next";

import { StoreLamp } from "./StoreLamp";
import styles from "./StoreStrip.module.css";

/** Tira de lámparas: qué tiendas se consultaron y cómo respondió cada una. */
export function StoreStrip({
  stores,
  statuses,
}: {
  stores: readonly Store[];
  statuses: readonly StoreStatus[];
}) {
  const { t } = useTranslation("search");
  const byId = new Map(statuses.map((status) => [status.id, status]));

  return (
    <section className={styles.strip} aria-labelledby="stores-heading">
      <h2 id="stores-heading" className="visually-hidden">
        {t("stores.heading")}
      </h2>
      <ul className={styles.list}>
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
    </section>
  );
}

/**
 * Tiendas que faltan en los resultados, separadas por motivo para que el aviso diga
 * lo mismo que la tira de lámparas: no respondieron (tiempo o error) o están en pausa.
 */
export function missingStores(stores: readonly Store[], statuses: readonly StoreStatus[]) {
  const names = (codes: readonly StoreStatus["status"][]) => {
    const ids = new Set(statuses.filter((s) => codes.includes(s.status)).map((s) => s.id));
    return stores.filter((store) => ids.has(store.id)).map((store) => store.name);
  };
  return { unresponsive: names(["timeout", "error"]), paused: names(["paused"]) };
}
