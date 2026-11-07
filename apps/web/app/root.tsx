import { I18nextProvider, useTranslation } from "react-i18next";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { i18n } from "./i18n";
import "./styles/global.css";
import styles from "./root.module.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={i18n.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useTranslation();

  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? t("errors.notFoundTitle") : t("errors.title");
  const details = notFound ? t("errors.notFoundDetails") : t("errors.unexpected");
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main className={styles.error}>
      <h1>{title}</h1>
      <p>{details}</p>
      <Link to="/">{t("errors.backHome")}</Link>
      {stack && (
        <pre className={styles.stack}>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
