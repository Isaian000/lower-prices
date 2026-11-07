import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { APP_NAME } from "~/config";

import styles from "./SiteChrome.module.css";

/** Encabezado: nombre y, en resultados, la búsqueda compacta. */
export function SiteHeader({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <>
      <a className="skip-link" href="#main">
        {t("skipToContent")}
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand} aria-label={t("homeLink", { appName: APP_NAME })}>
            {/* Una etiqueta de anaquel con su franja amarilla: el mejor precio. */}
            <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.brandMark}>
              <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2" className={styles.tag} />
              <path d="M3.5 5.5h17v4h-17z" className={styles.band} />
              <path d="M6.5 15.5h7" className={styles.line} />
            </svg>
            {APP_NAME}
          </Link>
          {children && <div className={styles.headerSlot}>{children}</div>}
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <p>{t("footer.neutral")}</p>
        <p>{t("footer.prices")}</p>
      </div>
    </footer>
  );
}
