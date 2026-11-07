import type { ProductGroup, SearchResponse, SearchSort, Store } from "@lower-prices/shared";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, redirect, useFetcher, useNavigation } from "react-router";

import { Board, BoardSkeleton } from "~/components/Board";
import { SearchForm } from "~/components/SearchForm";
import { SiteFooter, SiteHeader } from "~/components/SiteChrome";
import { SORTS, SortSwitch } from "~/components/SortSwitch";
import { missingStores, StoreStrip } from "~/components/StoreStrip";
import { APP_NAME } from "~/config";
import { i18n } from "~/i18n";
import { fetchStores, searchProducts } from "~/lib/api.server";
import { formatTime } from "~/lib/format";

import type { Route } from "./+types/search";
import styles from "./search.module.css";

function parseSort(value: string | null): SearchSort {
  return SORTS.includes(value as SearchSort) ? (value as SearchSort) : "relevance";
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (!q) throw redirect("/");

  const sort = parseSort(url.searchParams.get("sort"));
  const cursor = url.searchParams.get("cursor") ?? undefined;
  // La lista de tiendas da nombre a las columnas aunque una tienda no traiga ofertas.
  const [result, storeList] = await Promise.all([
    searchProducts({ q, sort, cursor }),
    cursor ? Promise.resolve(null) : fetchStores(),
  ]);
  return { q, sort, result, stores: storeList?.stores ?? [] };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const query = loaderData?.q ?? "";
  return [
    { title: i18n.t("search:metaTitle", { query, appName: APP_NAME }) },
    // Las búsquedas internas no se indexan (ver README, SEO).
    { name: "robots", content: "noindex, follow" },
  ];
}

export default function Search({ loaderData }: Route.ComponentProps) {
  const { q, sort, result, stores: catalog } = loaderData;
  const navigation = useNavigation();
  const searching = navigation.state === "loading" && navigation.location.pathname === "/buscar";

  return (
    <>
      <SiteHeader>
        <SearchForm size="compact" defaultValue={q} />
      </SiteHeader>
      <main id="main" className={styles.main}>
        {searching ? (
          <Searching />
        ) : result.ok ? (
          // La key reinicia "cargar más" al cambiar la búsqueda o el orden.
          <Results key={`${q}|${sort}`} q={q} sort={sort} first={result.data} catalog={catalog} />
        ) : (
          <Failure q={q} reason={result.reason} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}

/** Columnas del tablero: las tiendas consultadas, en el orden de la respuesta. */
function storesOf(data: SearchResponse, catalog: readonly Store[]): Store[] {
  const known = new Map(catalog.map((store) => [store.id, store]));
  for (const group of data.groups) {
    for (const offer of group.offers) known.set(offer.store.id, offer.store);
  }
  return data.stores.map((status) => known.get(status.id) ?? { id: status.id, name: status.id });
}

function Searching() {
  return (
    <div className={styles.results}>
      <BoardSkeleton rows={5} />
    </div>
  );
}

function Results({
  q,
  sort,
  first,
  catalog,
}: {
  q: string;
  sort: SearchSort;
  first: SearchResponse;
  catalog: readonly Store[];
}) {
  const { t } = useTranslation("search");
  const fetcher = useFetcher<typeof loader>();
  const [groups, setGroups] = useState<ProductGroup[]>(first.groups);
  const [cursor, setCursor] = useState(first.nextCursor);
  const [added, setAdded] = useState<{ from: number; count: number } | null>(null);
  const stores = storesOf(first, catalog);
  const missing = missingStores(stores, first.stores);
  const list = (names: string[]) =>
    new Intl.ListFormat("es-MX", { type: "conjunction" }).format(names);

  // Suma el bloque que llegó, sin repetir grupos que ya estaban. Se hace durante el render
  // (estado derivado de fetcher.data) en vez de en un efecto, como recomienda React.
  const [processed, setProcessed] = useState(fetcher.data);
  if (fetcher.data !== processed) {
    setProcessed(fetcher.data);
    if (fetcher.data?.result.ok) {
      const page = fetcher.data.result.data;
      const seen = new Set(groups.map((group) => group.id));
      const fresh = page.groups.filter((group) => !seen.has(group.id));
      setAdded({ from: groups.length, count: fresh.length });
      setGroups([...groups, ...fresh]);
      setCursor(page.nextCursor);
    }
  }

  const loadingMore = fetcher.state !== "idle";
  const loadFailed =
    fetcher.state === "idle" && fetcher.data !== undefined && !fetcher.data.result.ok;

  function loadMore() {
    if (!cursor) return;
    const params = new URLSearchParams({ q, sort, cursor });
    void fetcher.load(`/buscar?${params.toString()}`);
  }

  if (groups.length === 0) return <Empty q={q} stores={stores} statuses={first} />;

  return (
    <div className={styles.results}>
      <div className={styles.heading}>
        <h1 className={styles.title}>{t("heading", { query: q })}</h1>
        <p className={styles.meta}>
          <span>{t("summary", { count: groups.length })}</span>
          <span>{t("consultedAt", { time: formatTime(first.fetchedAt) })}</span>
        </p>
      </div>

      {/* Estado de las tiendas y orden en una sola franja del tablero. */}
      <div className={styles.statusRow}>
        <StoreStrip stores={stores} statuses={first.stores} />
        <SortSwitch query={q} current={sort} />
      </div>

      {(missing.unresponsive.length > 0 || missing.paused.length > 0) && (
        <p className={styles.partial} role="status">
          {missing.unresponsive.length > 0 &&
            t("stores.partialNotice", {
              count: missing.unresponsive.length,
              stores: list(missing.unresponsive),
            })}
          {missing.unresponsive.length > 0 && missing.paused.length > 0 && " "}
          {missing.paused.length > 0 &&
            t("stores.pausedNotice", {
              count: missing.paused.length,
              stores: list(missing.paused),
            })}
        </p>
      )}

      <Board groups={groups} storeCount={first.stores.length} />

      <div className={styles.more}>
        <p className="visually-hidden" role="status" aria-live="polite">
          {added ? t("loadedMore", { count: added.count }) : ""}
        </p>
        {cursor ? (
          <button
            type="button"
            className={styles.moreButton}
            onClick={loadMore}
            disabled={loadingMore}
            aria-busy={loadingMore}
          >
            {loadingMore ? t("loadingMore") : t("loadMore")}
          </button>
        ) : (
          <p className={styles.end}>{t("end")}</p>
        )}
        {loadFailed && (
          <p className={styles.moreError} role="alert">
            {t("unavailable.body")}
          </p>
        )}
      </div>
    </div>
  );
}

function Empty({ q, stores, statuses }: { q: string; stores: Store[]; statuses: SearchResponse }) {
  const { t } = useTranslation(["search", "home"]);
  const examples = t("home:examples", { returnObjects: true });

  return (
    <div className={styles.results}>
      <div className={styles.statusRow}>
        <StoreStrip stores={stores} statuses={statuses.stores} />
      </div>
      <div className={styles.state}>
        <h1 className={styles.stateTitle}>{t("empty.title", { query: q })}</h1>
        <p className={styles.stateBody}>{t("empty.body")}</p>
        <h2 className={styles.tryHeading}>{t("empty.tryHeading")}</h2>
        <ul className={styles.tryList}>
          {examples.map((example) => (
            <li key={example}>
              <Link to={`/buscar?${new URLSearchParams({ q: example }).toString()}`}>
                {example}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Failure({
  q,
  reason,
}: {
  q: string;
  reason: "all_stores_failed" | "invalid_request" | "unavailable";
}) {
  const { t } = useTranslation("search");
  const key = reason === "all_stores_failed" ? "failed" : "unavailable";
  const retry = `/buscar?${new URLSearchParams({ q }).toString()}`;

  return (
    <div className={styles.results}>
      <div className={styles.state} role="alert">
        <h1 className={styles.stateTitle}>{t(`${key}.title`)}</h1>
        <p className={styles.stateBody}>{t(`${key}.body`)}</p>
        <Link className={styles.moreButton} to={retry} reloadDocument>
          {t(`${key}.retry`)}
        </Link>
      </div>
    </div>
  );
}
