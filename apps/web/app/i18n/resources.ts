import common from "~/locales/es-MX/common.json";
import home from "~/locales/es-MX/home.json";

// Para agregar un idioma: crear app/locales/<idioma>/ con los mismos archivos y registrarlo aquí.
export const resources = {
  "es-MX": { common, home },
} as const;

export const defaultNS = "common";
