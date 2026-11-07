import type { StoreStatusCode } from "@lower-prices/shared";

import styles from "./StoreLamp.module.css";

export type LampState = StoreStatusCode | "idle";

/**
 * Marca de estado de una tienda. El estado se dice con la forma, no solo con el color:
 * círculo lleno = respondió; aro punteado = no respondió a tiempo; aro tachado = error o en pausa.
 * Es decorativa: el estado siempre va también en texto.
 */
export function StoreLamp({ state }: { state: LampState }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.lamp} data-state={state}>
      {state === "ok" || state === "idle" ? (
        <circle cx="8" cy="8" r="4.5" className={styles.fill} />
      ) : (
        <circle cx="8" cy="8" r="5.25" className={styles.ring} />
      )}
      {(state === "error" || state === "paused") && (
        <path d="M3.75 12.25 12.25 3.75" className={styles.slash} />
      )}
    </svg>
  );
}
