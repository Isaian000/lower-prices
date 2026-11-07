import i18next, { type i18n as I18n } from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE } from "~/config";

import { defaultNS, resources } from "./resources";

// Las traducciones van empaquetadas, así que la inicialización es síncrona
// y el HTML del servidor (SSR) ya sale traducido.
export const i18n: I18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [DEFAULT_LOCALE],
  resources,
  defaultNS,
  ns: Object.keys(resources[DEFAULT_LOCALE]),
  interpolation: { escapeValue: false },
  initAsync: false,
});
