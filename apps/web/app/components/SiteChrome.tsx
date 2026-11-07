import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { APP_NAME } from "~/config";

import styles from "./SiteChrome.module.css";

/** Franja superior del tablero: nombre y, en resultados, la búsqueda compacta. */
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
            <span aria-hidden="true" className={styles.brandMark}>
              {/* Signo de pesos en matriz de 5×7 puntos, como un dígito del tablero. */}
              <svg viewBox="0 0 20 28" className={styles.brandDots}>
                <circle cx="10" cy="2" r="1.55" />
                <circle cx="6" cy="6" r="1.55" />
                <circle cx="10" cy="6" r="1.55" />
                <circle cx="14" cy="6" r="1.55" />
                <circle cx="18" cy="6" r="1.55" />
                <circle cx="2" cy="10" r="1.55" />
                <circle cx="10" cy="10" r="1.55" />
                <circle cx="6" cy="14" r="1.55" />
                <circle cx="10" cy="14" r="1.55" />
                <circle cx="14" cy="14" r="1.55" />
                <circle cx="10" cy="18" r="1.55" />
                <circle cx="18" cy="18" r="1.55" />
                <circle cx="2" cy="22" r="1.55" />
                <circle cx="6" cy="22" r="1.55" />
                <circle cx="10" cy="22" r="1.55" />
                <circle cx="14" cy="22" r="1.55" />
                <circle cx="10" cy="26" r="1.55" />
              </svg>
            </span>
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
