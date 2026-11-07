import { useTranslation } from "react-i18next";
import { Link, useNavigation } from "react-router";

import { BoardSkeleton } from "~/components/Board";
import { SearchForm } from "~/components/SearchForm";
import { SiteFooter, SiteHeader } from "~/components/SiteChrome";
import { APP_NAME, DEFAULT_LOCALE } from "~/config";
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
  const searching = navigation.state === "loading" && navigation.location.pathname === "/buscar";
  const examples = t("examples", { returnObjects: true });
  const storeNames = loaderData.stores?.map((store) => store.name) ?? [];

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
          <p className={styles.stores}>
            {storeNames.length > 0
              ? t("storesLine", {
                  count: storeNames.length,
                  stores: new Intl.ListFormat(DEFAULT_LOCALE, { type: "conjunction" }).format(
                    storeNames,
                  ),
                })
              : t("storesUnavailable")}
          </p>
        </section>

        {searching && (
          <section className={styles.loading}>
            <BoardSkeleton rows={3} />
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
