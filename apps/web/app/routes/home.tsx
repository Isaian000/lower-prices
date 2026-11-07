import { useTranslation } from "react-i18next";

import { APP_NAME } from "~/config";
import { i18n } from "~/i18n";
import { fetchApiHealth } from "~/lib/api.server";

import type { Route } from "./+types/home";
import styles from "./home.module.css";

export function meta(_: Route.MetaArgs) {
  return [
    { title: i18n.t("home:metaTitle", { appName: APP_NAME }) },
    { name: "description", content: i18n.t("home:metaDescription") },
  ];
}

export async function loader(_: Route.LoaderArgs) {
  const health = await fetchApiHealth();
  return { apiUp: health !== null };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation(["home", "common"]);

  return (
    <>
      <a className="skip-link" href="#main">
        {t("common:skipToContent")}
      </a>
      <header className={styles.header}>
        <span className={styles.brand}>{APP_NAME}</span>
      </header>
      <main id="main" className={styles.main}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>

        <section className={styles.status} aria-labelledby="status-heading">
          <h2 id="status-heading" className={styles.statusHeading}>
            {t("status.heading")}
          </h2>
          <p className={loaderData.apiUp ? styles.up : styles.down}>
            <span aria-hidden="true" className={styles.dot} />
            {loaderData.apiUp ? t("status.apiUp") : t("status.apiDown")}
          </p>
          <p className={styles.muted}>{t("status.comingSoon")}</p>
        </section>
      </main>
    </>
  );
}
