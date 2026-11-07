import "i18next";

import type { defaultNS, resources } from "./resources";

// Claves de traducción tipadas: t("clave") falla al compilar si la clave no existe.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["es-MX"];
  }
}
