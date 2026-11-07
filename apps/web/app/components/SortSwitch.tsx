import type { SearchSort } from "@lower-prices/shared";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import styles from "./SortSwitch.module.css";

export const SORTS: readonly SearchSort[] = ["relevance", "price_asc", "price_desc"];

/** Interruptores de orden. Son enlaces: cada orden tiene su URL y funciona sin JavaScript. */
export function SortSwitch({ query, current }: { query: string; current: SearchSort }) {
  const { t } = useTranslation("search");

  return (
    <nav className={styles.switch} aria-label={t("sort.label")}>
      <span className={styles.label} aria-hidden="true">
        {t("sort.label")}
      </span>
      <ul className={styles.options}>
        {SORTS.map((sort) => {
          const params = new URLSearchParams({ q: query });
          if (sort !== "relevance") params.set("sort", sort);
          const active = sort === current;
          return (
            <li key={sort}>
              <Link
                to={`/buscar?${params.toString()}`}
                className={styles.option}
                aria-current={active ? "true" : undefined}
                preventScrollReset
              >
                {t(`sort.${sort}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
