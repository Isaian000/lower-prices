import type { StoreStatusCode } from "@lower-prices/shared";

import styles from "./StoreLamp.module.css";

export type LampState = StoreStatusCode | "idle";

/**
 * Lámpara de estado de una tienda, como las del tablero.
 * Llena = respondió; hueca = no respondió a tiempo; tachada = error o en pausa;
 * punto tenue = todavía sin consultar (nunca un aro, para no confundirse con «no respondió»).
 * Es decorativa: el estado siempre va también en texto.
 */
export function StoreLamp({ state }: { state: LampState }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.lamp} data-state={state}>
      {state === "idle" ? (
        <circle cx="8" cy="8" r="4" className={styles.idle} />
      ) : (
        <circle cx="8" cy="8" r="5.5" className={styles.ring} />
      )}
      {(state === "error" || state === "paused") && (
        <path d="M3.5 12.5 12.5 3.5" className={styles.slash} />
      )}
    </svg>
  );
}
