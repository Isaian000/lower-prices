import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import styles from "./SearchForm.module.css";

interface SearchFormProps {
  defaultValue?: string;
  /** "hero" en el inicio, "compact" en la franja superior de resultados. */
  size?: "hero" | "compact";
}

/** Ranura de búsqueda del tablero. Es un formulario GET: funciona también sin JavaScript. */
export function SearchForm({ defaultValue = "", size = "hero" }: SearchFormProps) {
  const { t } = useTranslation();
  const id = useId();
  const navigation = useNavigation();
  const searching = navigation.state !== "idle" && navigation.location?.pathname === "/buscar";

  return (
    <Form method="get" action="/buscar" role="search" className={styles.form} data-size={size}>
      <label htmlFor={id} className={size === "compact" ? "visually-hidden" : styles.label}>
        {t("searchForm.label")}
      </label>
      <div className={styles.slot}>
        <input
          id={id}
          className={styles.input}
          type="search"
          name="q"
          defaultValue={defaultValue}
          // Se reinicia al cambiar de búsqueda (p. ej. al usar "atrás").
          key={defaultValue}
          placeholder={t("searchForm.placeholder")}
          required
          maxLength={100}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
        />
        <button className={styles.submit} type="submit" aria-busy={searching}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.icon}>
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m15.5 15.5 5 5" />
          </svg>
          <span className={styles.submitText}>{t("searchForm.submit")}</span>
        </button>
      </div>
    </Form>
  );
}
