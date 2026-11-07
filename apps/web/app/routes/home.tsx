import type { Store } from "@lower-prices/shared";
import { useTranslation } from "react-i18next";
import { Link, useNavigation } from "react-router";

import { BoardSkeleton } from "~/components/Board";
import { SearchForm } from "~/components/SearchForm";
import { SiteFooter, SiteHeader } from "~/components/SiteChrome";
import { StoreLamp } from "~/components/StoreLamp";
import { APP_NAME } from "~/config";
import { i18n } from "~/i18n";
import { fetchStores } from "~/lib/api.server";

import type { Route } from "./+types/home";
import styles from "./home.module.css";

export function meta(_: Route.MetaArgs) {
  return [
    { title: i18n.t("home:metaTitle", { appName: APP_NAME }) },
    { name: "description", content: i18n.t("home:metaDescription") },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  const response = await fetchStores();
  return { stores: response?.stores ?? null };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation("home");
  const navigation = useNavigation();
  const stores: readonly Store[] = loaderData.stores ?? [];
  const searching = navigation.state === "loading" && navigation.location.pathname === "/buscar";
  const examples = t("examples", { returnObjects: true });

  return (
    <>
      <SiteHeader />
      <main id="main" className={styles.main}>
        <section className={styles.intro} aria-labelledby="home-title">
          <h1 id="home-title" className={styles.title}>
            {t("title")}
          </h1>
          <p className={styles.subtitle}>{t("subtitle")}</p>
          <div className={styles.search}>
            <SearchForm size="hero" />
          </div>
          <div className={styles.examples}>
            <h2 className={styles.examplesHeading}>{t("examplesHeading")}</h2>
            <ul className={styles.exampleList}>
              {examples.map((example) => (
                <li key={example}>
                  <Link
                    className={styles.example}
                    to={`/buscar?${new URLSearchParams({ q: example }).toString()}`}
                  >
                    {example}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.boardSection} aria-labelledby="board-heading">
          <h2 id="board-heading" className={styles.boardHeading}>
            {t("boardHeading")}
          </h2>
          {loaderData.stores === null ? (
            <p className={styles.notice}>{t("storesUnavailable")}</p>
          ) : searching ? (
            <BoardSkeleton stores={stores} rows={3} />
          ) : (
            <EmptyBoard stores={stores} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/** Filas del tablero en espera: módulos apagados, listos para encenderse. */
const IDLE_ROWS = 4;

/** El tablero en espera: las tiendas como columnas y filas con los segmentos apagados. */
function EmptyBoard({ stores }: { stores: readonly Store[] }) {
  const { t } = useTranslation("home");

  return (
    <div className={styles.emptyBoard} style={{ "--stores": stores.length } as React.CSSProperties}>
      <ul className={styles.storeColumns}>
        {stores.map((store) => (
          <li key={store.id} className={styles.storeColumn}>
            <StoreLamp state="idle" />
            <span>{store.name}</span>
          </li>
        ))}
      </ul>
      {Array.from({ length: IDLE_ROWS }, (_, row) => (
        <div key={row} className={styles.emptyRow}>
          {row === 0 ? (
            <p className={styles.emptyText}>{t("boardEmpty")}</p>
          ) : (
            <span className={styles.emptyProduct} aria-hidden="true">
              <span className={styles.idleBar} style={{ width: `${62 - row * 12}%` }} />
            </span>
          )}
          {stores.map((store) => (
            <span
              key={store.id}
              className={styles.emptyCell}
              data-store={store.name}
              aria-hidden="true"
            >
              $8,888
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
