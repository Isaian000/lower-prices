# lower-prices

## Propósito del proyecto

Aplicación web que compara los precios de un mismo producto en distintas tiendas en línea de México, en una sola vista. Evita tener que buscar página por página el precio más bajo y es especialmente útil en temporadas de ofertas (Buen Fin, Hot Sale, Black Friday, Cyber Monday).

**Etapa actual:** proyecto personal. **Meta a futuro:** monetizarlo, principalmente con programas de afiliados.

> "lower-prices" es un nombre provisional. El nombre comercial se definirá en las últimas etapas del proyecto.

---

## Alcance del MVP

### Incluye

- Buscar un producto por texto libre (nombre, marca o modelo).
- Consultar varias tiendas mexicanas y mostrar los resultados en una vista unificada.
- Ordenar por precio y filtrar por tienda y rango de precio.
- Mostrar las opciones de meses sin intereses de cada oferta.
- Botón "cargar más" para ver más resultados.
- Agrupar el mismo producto ofrecido en distintas tiendas cuando sea posible identificarlo.
- Enlace directo a la página del producto en cada tienda.
- Uso sin registro.

### No incluye (fases posteriores)

- Cuentas de usuario y listas de seguimiento.
- Historial de precios y gráficas.
- Alertas de bajada de precio.
- Búsqueda por enlace de una tienda o por código de barras.
- Enlaces de afiliado (se dejan previstos en el diseño, ver _Monetización_).
- Productos usados o reacondicionados. En el MVP solo se muestran productos nuevos.
- Costo de envío. En el MVP solo se compara el precio del producto.
- Filtro por categoría.

---

## Requisitos funcionales (MVP)

| ID    | Requisito                                                                                                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-01 | El usuario puede buscar un producto escribiendo texto libre.                                                                                                                                        |
| RF-02 | El sistema consulta en paralelo todas las tiendas habilitadas y junta sus resultados.                                                                                                               |
| RF-03 | Cada resultado muestra: nombre, imagen, precio actual, precio anterior o descuento (si existe), meses sin intereses (si existen), tienda, disponibilidad y enlace. No se muestra el costo de envío. |
| RF-04 | Los resultados se pueden ordenar por precio (ascendente o descendente) y por relevancia.                                                                                                            |
| RF-05 | Los resultados se pueden filtrar por tienda y por rango de precio.                                                                                                                                  |
| RF-06 | Las ofertas del mismo producto en distintas tiendas se agrupan y el precio más bajo se destaca.                                                                                                     |
| RF-07 | Si una tienda falla o tarda demasiado, se muestran los resultados de las demás con un aviso de que esa tienda no respondió.                                                                         |
| RF-08 | Los precios se muestran en MXN e indican cuándo se obtuvieron.                                                                                                                                      |
| RF-09 | Solo se muestran productos nuevos. Los usados y reacondicionados se excluyen en todas las tiendas.                                                                                                  |
| RF-10 | Cada oferta muestra sus opciones de meses sin intereses (p. ej. "12 MSI de $491.58"), cuando la tienda las informa.                                                                                 |
| RF-11 | Los resultados se cargan por bloques con un botón "cargar más" (paginación por cursor).                                                                                                             |

## Requisitos no funcionales

| ID     | Categoría            | Requisito                                                                                                                                                                                                                                                         |
| ------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Rendimiento          | Respuesta de búsqueda en menos de 3 s (p95) con caché fría y menos de 500 ms con caché caliente.                                                                                                                                                                  |
| RNF-02 | Resiliencia          | Cada tienda tiene un tiempo límite propio (~2.5 s). La falla de una tienda no tumba la búsqueda.                                                                                                                                                                  |
| RNF-03 | Frescura             | Los resultados en caché caducan entre 15 y 60 min. El tiempo de caducidad se configura por tienda.                                                                                                                                                                |
| RNF-04 | Escalabilidad        | Diseño sin estado en la API para poder levantar más instancias en temporada de ofertas.                                                                                                                                                                           |
| RNF-05 | Extensibilidad       | Agregar una tienda solo requiere implementar un adaptador nuevo, sin cambiar el núcleo.                                                                                                                                                                           |
| RNF-06 | Fuentes de datos     | **Prioridad a las APIs oficiales o de afiliados de cada tienda.** El scraping es el último recurso y solo se usa para tiendas sin API, respetando términos de uso, `robots.txt` y límites de peticiones.                                                          |
| RNF-07 | Observabilidad       | Logs estructurados y métricas por tienda (latencia, errores, resultados devueltos) para detectar cuándo se rompe un adaptador.                                                                                                                                    |
| RNF-08 | Usabilidad           | Interfaz responsive, enfocada en móvil.                                                                                                                                                                                                                           |
| RNF-09 | Calidad              | TypeScript estricto y pruebas de cada adaptador con respuestas grabadas (fixtures).                                                                                                                                                                               |
| RNF-10 | Accesibilidad        | Cumplir **WCAG 2.2 nivel AA**: HTML semántico, navegación completa con teclado, foco visible, contraste mínimo de 4.5:1, etiquetas en formularios, texto alternativo en imágenes, anuncios `aria-live` al cargar resultados y respeto a `prefers-reduced-motion`. |
| RNF-11 | Portabilidad         | El código no depende del proveedor de hosting. Debe correr en un servicio gratuito (Vercel o similar) y migrarse a un VPS (p. ej. Hostinger) sin reescribirse. La app Express se exporta separada de `listen()` y la configuración va en variables de entorno.    |
| RNF-12 | Internacionalización | Todos los textos visibles pasan por la librería de i18n (ninguno se escribe directo en componentes). Precios y fechas se formatean con `Intl`. Agregar un idioma no requiere tocar componentes.                                                                   |

---

## Tiendas objetivo (México)

### Política de fuentes de datos

Cada tienda se integra con la mejor fuente disponible, en este orden:

1. **API oficial para terceros** de la tienda (con credenciales y términos de uso).
2. **API o feed de productos de afiliados**: programa directo de la tienda o redes como Admitad o Awin, que suelen ofrecer catálogos con precios.
3. **API pública de la plataforma de la tienda**: endpoints JSON públicos y sin autenticación que usa el propio sitio de la tienda (p. ej. el catálogo de VTEX). Son estables y estructurados, pero no hay un acuerdo formal con la tienda.
4. **Scraping de HTML**, solo si no existe ninguna de las anteriores y los términos de uso lo permiten. Se marca como fuente frágil.

### Tiendas para el MVP: tiendas VTEX (verificado el 2026-11-06)

Varias tiendas mexicanas usan la plataforma **VTEX**, que expone una API pública de búsqueda de catálogo en JSON, sin credenciales:

```
GET https://<tienda>/api/catalog_system/pub/products/search?ft=<texto>&_from=0&_to=9
```

Devuelve nombre, marca, **EAN (código de barras)**, modelo, precio, precio de lista, disponibilidad, imágenes y enlace. Un solo **adaptador VTEX genérico**, configurado por tienda, cubre todas.

| Tienda    | Fuente           | Estado        | Notas                                          |
| --------- | ---------------- | ------------- | ---------------------------------------------- |
| Elektra   | API pública VTEX | ✅ Verificada | Electrónica, línea blanca, celulares, muebles. |
| Chedraui  | API pública VTEX | ✅ Verificada | Supermercado + electrónica y hogar.            |
| OfficeMax | API pública VTEX | ✅ Verificada | Papelería, cómputo y oficina.                  |
| Martí     | API pública VTEX | ✅ Verificada | Deportes.                                      |

> Se comprobó que Elektra y Chedraui venden la misma pantalla TCL con el mismo EAN, así que la agrupación por código de barras funciona entre tiendas reales.

### Otras tiendas (fases posteriores)

| Tienda                                             | Fuente prioritaria                      | Estado      | Notas                                                                                                                                                             |
| -------------------------------------------------- | --------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mercado Libre                                      | API oficial                             | ⚠️ Incierto | La búsqueda responde 403 sin token. Hay reportes de que la búsqueda pública de productos se restringió incluso con app registrada. Verificar al registrar la app. |
| Amazon MX                                          | **Creators API** (afiliados)            | ⬜          | La PA-API 5 fue retirada en 2026 y la sustituye la Creators API (OAuth 2.0). Requiere Amazon Afiliados con elegibilidad propia.                                   |
| Coppel                                             | Feed de afiliados (Admitad)             | ⬜          | Programa listado en Admitad. Confirmar si incluye feed de productos.                                                                                              |
| Liverpool                                          | Feed de afiliados (Awin, por confirmar) | ⬜          | Sin API pública.                                                                                                                                                  |
| Walmart MX / Bodega Aurrera                        | Afiliados (FlexOffers, por confirmar)   | ⬜          | Sin API pública.                                                                                                                                                  |
| Sanborns, Soriana, Costco, Home Depot, Best Buy... | Por evaluar                             | ⬜          | Su API VTEX no responde o bloquean bots.                                                                                                                          |

---

## Arquitectura

### Enfoque del MVP: búsqueda federada bajo demanda

Con categorías tan variadas no es viable mantener un catálogo propio de todo. Por eso, en el MVP la búsqueda del usuario se reenvía en paralelo a cada tienda, los resultados se normalizan y se guardan en caché por un tiempo corto.

```
 ┌──────────────┐     HTTP      ┌──────────────────────────────────────┐
 │  Web (SSR)   │ ────────────▶ │         API (Node + Express)         │
 │ React Router │ ◀──────────── │                                      │
 └──────────────┘     JSON      │  /api/search?q=...                   │
                                │      │                               │
                                │      ▼                               │
                                │  SearchService ──▶ Caché (Redis)     │
                                │      │                               │
                                │      ▼  (en paralelo, con timeout)   │
                                │  ┌────────┬────────┬────────┐        │
                                │  │Adapter │Adapter │Adapter │  ...   │
                                │  │  ML    │ Amazon │Walmart │        │
                                │  └───┬────┴───┬────┴───┬────┘        │
                                │      ▼        ▼        ▼             │
                                │  Normalizador ──▶ Agrupador (match)  │
                                └──────────────────────────────────────┘
                                                 │
                                      APIs / sitios de las tiendas
```

### Componentes

- **Web (React Router v8 + Express):** genera el HTML en el servidor (SSR) para SEO y vistas previas al compartir, y consume la API.
- **API (Express):** valida la entrada, consulta la caché y orquesta los adaptadores.
- **Adaptadores de tienda:** uno por tienda. Todos implementan la misma interfaz:
  ```ts
  interface StoreAdapter {
    store: Store; // { id: "elektra", name: "Elektra" }
    search(params: {
      query: string;
      offset: number;
      limit: number;
      sort: SearchSort;
      minPrice?: number;
      maxPrice?: number;
      signal?: AbortSignal; // se aborta al vencer el timeout de la tienda
    }): Promise<{ offers: Offer[]; total: number }>;
  }
  ```
- **Normalizador:** convierte la respuesta de cada tienda en el modelo común `Offer`.
- **Agrupador:** junta ofertas del mismo producto comparando los datos del JSON de cada tienda, por niveles de confianza:
  1. **GTIN/EAN/UPC** (código de barras): confianza muy alta.
  2. **Marca + modelo** normalizados: confianza alta.
  3. **Similitud del título** normalizado por encima de un umbral: confianza media.

  Además, saca del grupo las ofertas con un precio muy alejado del resto (probables accesorios) y junta los duplicados dentro de una misma tienda (p. ej. varios vendedores con la misma publicación de catálogo en Mercado Libre), mostrando el más barato. Cada grupo indica con qué nivel se agrupó (`matchedBy`).

  Reglas aplicadas (ajustadas con datos reales):
  - El GTIN se normaliza a 14 dígitos y se descarta si su dígito de control es inválido (algunas tiendas publican EAN truncados).
  - El modelo solo cuenta si tiene al menos un número (descarta textos como "Mando a distancia universal") y las marcas genéricas ("GENERICA") se ignoran.
  - En los niveles 2 y 3 no se juntan dos publicaciones de la misma tienda ni dos ofertas con GTIN distinto (p. ej. el mismo audífono en otro color).
  - Similitud de títulos: coeficiente de Dice sobre palabras normalizadas, umbral 0.8, con marca igual si ambas la tienen.
  - Precio atípico: menos del 40 % de la mediana del grupo (no aplica a grupos por GTIN).

- **Caché:** guarda los resultados por consulta normalizada y tienda, con caducidad configurable. Reduce latencia y carga sobre las tiendas. En memoria en desarrollo, Redis externo (p. ej. Upstash) en hosting serverless.

### Modelo de datos común

```ts
interface Store {
  id: string; // "mercadolibre"
  name: string; // "Mercado Libre"
  logoUrl?: string;
}

interface Installment {
  months: number; // 3, 6, 12...
  amount: number; // pago mensual en MXN
  interestFree: boolean; // true = meses sin intereses
}

interface Offer {
  id: string; // "<storeId>:<id en la tienda>"
  store: Store;
  title: string;
  url: string;
  imageUrl?: string;
  price: number; // MXN
  originalPrice?: number; // precio antes del descuento
  discountPercent?: number;
  currency: "MXN";
  available: boolean;
  condition: "new"; // en el MVP solo productos nuevos; "used" | "refurbished" a futuro
  installments: Installment[]; // vacío si la tienda no informa
  identifiers?: { gtin?: string; brand?: string; model?: string; sku?: string };
  fetchedAt: string; // ISO 8601
}

interface ProductGroup {
  id: string; // "gtin:...", "model:..." o firma del título
  title: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  lowestPrice: number;
  highestPrice: number;
  offerCount: number;
  matchedBy: "gtin" | "model" | "title" | "single";
  offers: Offer[]; // ordenadas por precio
}

interface StoreStatus {
  id: string;
  status: "ok" | "timeout" | "error";
  count: number;
  durationMs: number;
}

// Respuesta de GET /api/search?q=...&cursor=...
interface SearchResponse {
  query: string;
  fetchedAt: string;
  groups: ProductGroup[];
  stores: StoreStatus[]; // permite avisar qué tienda no respondió
  nextCursor: string | null; // para "cargar más"; null = no hay más
}
```

### Evolución prevista (fases posteriores)

- **Base de datos (PostgreSQL):** guardar ofertas para tener historial de precios y un catálogo de productos agrupados.
- **Workers + cola (BullMQ sobre Redis):** actualizar precios en segundo plano de los productos más buscados o seguidos.
- **Cuentas, listas y alertas** encima de lo anterior.

---

## Stack

| Capa                    | Tecnología                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| Lenguaje                | TypeScript 6 (estricto)                                                                      |
| Backend                 | Node.js 24+ + Express 5 (`tsx` en desarrollo, `tsdown` para el build)                        |
| Peticiones HTTP         | `undici` / `fetch` nativo                                                                    |
| Integración con tiendas | APIs oficiales y de afiliados (prioridad); `cheerio` como respaldo de scraping si no hay API |
| Validación              | `zod`                                                                                        |
| Caché                   | En memoria (desarrollo) / Redis externo como Upstash (producción)                            |
| Logs                    | `pino`                                                                                       |
| Pruebas                 | `vitest` + `supertest`                                                                       |
| Frontend                | React + TypeScript con React Router v8 (modo framework, SSR sobre Express) y Vite            |
| Estilos                 | CSS Modules                                                                                  |
| Gestor de paquetes      | pnpm (workspaces)                                                                            |
| Internacionalización    | `i18next` + `react-i18next`. Único idioma inicial: español de México (`es-MX`)               |
| Calidad                 | ESLint 9 (con `jsx-a11y` para accesibilidad) + Prettier                                      |
| Hosting                 | Etapa inicial: Vercel (plan gratuito) + Upstash Redis. Después: VPS (p. ej. Hostinger)       |

### Estructura de carpetas

```
lower-prices/
├── apps/
│   ├── api/                       # Backend Express
│   │   └── src/
│   │       ├── app.ts             # crea la app Express (sin listen, portable a Vercel)
│   │       ├── server.ts          # arranque local / VPS
│   │       ├── config/env.ts      # variables de entorno validadas con zod
│   │       ├── routes/            # endpoints (/api/health, /api/search, /api/stores)
│   │       ├── search/            # servicio de búsqueda, agrupador y cursor
│   │       ├── stores/            # contrato StoreAdapter, registro de tiendas y adaptadores
│   │       │   └── vtex/          # adaptador VTEX genérico + fixtures grabados
│   │       ├── cache/             # caché en memoria o Upstash Redis
│   │       ├── lib/               # logger, normalización de producto y enlaces de salida
│   │       └── test/              # tiendas mock para las pruebas
│   │   └── scripts/               # grabación de fixtures
│   └── web/                       # Frontend React con SSR (React Router v8 + Express)
│       ├── server.js              # servidor Express (Vite en dev, build en producción)
│       ├── server/app.ts          # handler de React Router
│       └── app/
│           ├── root.tsx           # layout, <html lang>, i18n, página de error
│           ├── routes/            # páginas: inicio (/) y resultados (/buscar), con su *.module.css
│           ├── components/        # tablero de precios, buscador, lámparas de tiendas, orden
│           ├── i18n/              # configuración de i18next
│           ├── locales/es-MX/     # textos traducibles por módulo
│           ├── lib/               # formatos (Intl), cliente de la API (*.server.ts)
│           ├── styles/global.css  # tokens del tablero (colores, tipografía, espacio) y accesibilidad base
│           └── config.ts          # nombre provisional e idioma por defecto
└── packages/
    └── shared/                    # Tipos compartidos (Offer, ProductGroup, SearchResponse...)
```

---

## Desarrollo local

**Requisitos:** Node.js 24 o superior y pnpm 12 (`npm install -g pnpm`).

```bash
pnpm install        # instala las dependencias de todo el monorepo
pnpm dev            # levanta la API (:4000) y la web (:3000) a la vez
```

| Comando                                           | Qué hace                                                |
| ------------------------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                                        | API y web en modo desarrollo, con recarga automática    |
| `pnpm dev:api` / `pnpm dev:web`                   | Solo una de las dos                                     |
| `pnpm build`                                      | Compila la API y la web                                 |
| `pnpm start:api` / `pnpm start:web`               | Arranca el build de producción                          |
| `pnpm test`                                       | Pruebas (Vitest)                                        |
| `pnpm typecheck`                                  | Verificación de tipos                                   |
| `pnpm lint` / `pnpm lint:fix`                     | ESLint (incluye reglas de accesibilidad)                |
| `pnpm format` / `pnpm format:check`               | Prettier                                                |
| `pnpm --filter @lower-prices/api fixtures:record` | Vuelve a grabar los fixtures VTEX con respuestas reales |

### Variables de entorno

Todas son opcionales en desarrollo. Se pueden poner en un archivo `.env` dentro de cada app (no se versiona).

| App | Variable                                              | Por defecto             | Descripción                                                                                    |
| --- | ----------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------- |
| api | `PORT`                                                | `4000`                  | Puerto de la API                                                                               |
| api | `NODE_ENV`                                            | `development`           | `development` \| `production` \| `test`                                                        |
| api | `LOG_LEVEL`                                           | `info`                  | Nivel de logs de `pino` (`silent` para apagarlos)                                              |
| api | `STORE_TIMEOUT_MS`                                    | `2500`                  | Tiempo máximo de espera por tienda                                                             |
| api | `STORE_PAGE_SIZE`                                     | `10`                    | Resultados por tienda en cada bloque de "cargar más"                                           |
| api | `CACHE_TTL_SECONDS`                                   | `600`                   | Vida de la caché de resultados por tienda                                                      |
| api | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | —                       | Si ambas están definidas se usa Upstash Redis; si no, caché en memoria                         |
| api | `KV_REST_API_URL` / `KV_REST_API_TOKEN`               | —                       | Alternativa a las dos anteriores: son los nombres que crea la integración de Upstash en Vercel |
| api | `STORE_FAILURE_THRESHOLD`                             | `3`                     | Fallas seguidas de una tienda antes de pausarla                                                |
| api | `STORE_PAUSE_SECONDS`                                 | `60`                    | Duración de la pausa de una tienda que falla                                                   |
| api | `CORS_ORIGINS`                                        | `http://localhost:3000` | Orígenes que pueden llamar a la API desde el navegador, separados por coma                     |
| web | `PORT`                                                | `3000`                  | Puerto de la web                                                                               |
| web | `API_URL`                                             | `http://localhost:4000` | URL de la API (solo se usa en el servidor)                                                     |

### Endpoints de la API

| Endpoint                                                       | Descripción                                                                                                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                                              | Estado de la API                                                                                                    |
| `GET /api/openapi.json`                                        | Documentación OpenAPI 3.1 de la API                                                                                 |
| `GET /api/stores`                                              | Tiendas disponibles                                                                                                 |
| `GET /api/search?q=&cursor=&sort=&stores=&minPrice=&maxPrice=` | Búsqueda agrupada. `sort`: `relevance` (por defecto), `price_asc` o `price_desc`. `stores`: ids separados por coma. |

Respuestas de `/api/search`:

- `200` con `SearchResponse`, aunque alguna tienda falle (su estado viene en `stores`). Si todas respondieron, se cachea 5 minutos en el CDN (`s-maxage=300`); si fue parcial, `no-store`.
- `400` `invalid_request` (con `details`) o `invalid_cursor`.
- `500` `all_stores_failed`, solo si ninguna tienda respondió.

Las tiendas que fallan no pasan al cursor de "cargar más", para no reintentar una tienda caída en cada bloque.

**Protecciones:**

- **Pausa por tienda:** si una tienda falla 3 veces seguidas, se deja de consultar 60 segundos y aparece con estado `paused`. Mientras tanto se siguen usando sus resultados en caché.
- **Búsquedas simultáneas:** si llegan dos búsquedas iguales al mismo tiempo, se consulta a cada tienda una sola vez.
- **Enlaces de salida:** todos pasan por `buildOutboundUrl()` (`apps/api/src/lib/outbound.ts`). Solo se aceptan enlaces `https` al dominio de la tienda, y ahí se agregará la etiqueta de afiliado de cada tienda.
- **Seguridad:** cabeceras con `helmet` (CSP `default-src 'none'`, HSTS, `nosniff`) y CORS solo para `CORS_ORIGINS`, solo `GET`.
- **Contrato:** las pruebas validan que las respuestas reales cumplan `openapi.json`.

### Despliegue de la API en Vercel

1. Subir el repositorio a GitHub.
2. En Vercel: **Add New → Project**, importar el repositorio y poner **Root Directory** = `apps/api`. Vercel detecta Express solo (`src/app.ts` exporta la app por defecto); no hace falta `vercel.json`.
3. En **Storage → Upstash (Redis)**, crear una base gratuita y conectarla al proyecto. Eso crea `KV_REST_API_URL` y `KV_REST_API_TOKEN`, que la API ya reconoce.
4. Cuando exista la web, agregar su dominio en `CORS_ORIGINS`.
5. Desplegar y probar `/api/health` y `/api/search?q=tv`. Hay que confirmar que las tiendas VTEX no bloqueen las IP de Vercel: si aparecen en `error`, revisar los logs del proyecto.

### Diseño de la interfaz

- **Mundo visual:** la pizarra de una casa de cambio. Cada producto es una fila y cada tienda una columna; el precio más bajo de la fila se enciende en ámbar con la etiqueta "Más bajo". Fondo azul marino, letras de tablero (Archivo) y precios en dígitos de matriz de puntos (Doto), ambas fuentes autoalojadas.
- **Documentos:** `apps/web/PRODUCT.md` (usuarios, propósito y principios) y `apps/web/DESIGN.md` (tokens y reglas del sistema visual). El contrato de dirección está en `apps/web/.impeccable/surfaces/`.
- **Reglas que no se rompen:** el ámbar solo significa "precio más bajo"; el estado de cada tienda siempre va en texto además de su lámpara; las celdas sin oferta son módulos apagados (`$8,888` tenue); un solo tema oscuro.

### Convenciones

- **Textos:** ningún texto visible va directo en un componente. Se agrega a `apps/web/app/locales/es-MX/*.json` y se usa con `t("clave")`. Las claves están tipadas: una clave inexistente no compila.
- **Precios y fechas:** siempre con `formatPrice` / `formatDateTime` (`app/lib/format.ts`).
- **Estilos:** un `*.module.css` junto a cada componente. Colores, espacios y radios salen de los tokens de `styles/global.css`.
- **Código solo de servidor:** archivos `*.server.ts`. React Router impide que lleguen al navegador.

---

## Monetización (a futuro)

- **Afiliados:** Amazon Afiliados México, Mercado Libre Afiliados y redes como Admitad o Awin para otras tiendas. El enlace de cada `Offer` debe pasar por una función `buildOutboundUrl()`, para poder añadir la etiqueta de afiliado sin tocar los adaptadores.
- **Publicidad** no intrusiva y, más adelante, **funciones premium** (alertas ilimitadas, historial extendido).

## SEO

- **SSR desde el inicio** con React Router v8, para que Google y las redes sociales reciban HTML completo.
- `/buscar?q=...` lleva `noindex`: es compartible, pero no se indexa, como recomienda Google para búsquedas internas.
- A futuro: páginas indexables `/producto/:slug` y `/ofertas/:categoria` con datos estructurados schema.org (`Product` + `AggregateOffer`) y `sitemap.xml`.

## Riesgos y consideraciones

- **Acceso a APIs:** algunas APIs requieren aprobación o un mínimo de ventas (por ejemplo, la PA-API de Amazon). Hay que tramitar las cuentas de desarrollador y de afiliados desde el inicio.
- **Límites de las APIs:** las cuotas de peticiones obligan a usar caché agresiva y a no consultar más de lo necesario.
- **Scraping (si llega a usarse):** puede violar términos de uso, se rompe con cambios de HTML y es bloqueado por sistemas antibots. Por eso es el último recurso y no debe ser la base del negocio monetizado.
- **Agrupación de productos:** es el problema más difícil. En el MVP se acepta que algunas ofertas no se agrupen.
- **Sin límite de peticiones:** en la etapa personal la API no limita peticiones. El riesgo es que el uso abusivo agote las cuotas de las APIs de las tiendas o los límites del hosting gratuito. La caché lo reduce, pero hay que reevaluarlo antes de un lanzamiento público.
- **Hosting serverless:** en Vercel no hay memoria persistente entre peticiones, así que la caché debe ser externa (Redis).
- **APIs públicas VTEX:** no son APIs ofrecidas a terceros por contrato. La tienda puede bloquearlas o cambiarlas, y antes de monetizar hay que revisar los términos de uso de cada tienda o pasar a sus programas de afiliados. Se usan con caché, pocas peticiones y respetando `robots.txt` (hoy no bloquea `/api/`).
- **Meses sin intereses:** la API pública VTEX sí informa los planes por tarjeta (`Installments`). Solo cuentan como MSI los que tienen tasa 0 y no superan el precio de contado; OfficeMax, por ejemplo, ofrece meses con intereses, que no se muestran. Las promociones exclusivas de un banco pueden no aparecer.
- **Peculiaridades de VTEX:** el firewall rechaza con 400 las búsquedas con `+`, comillas, paréntesis, `<` o `>`. El adaptador codifica el espacio como `%20` y limpia esos caracteres.

---

## Fases del proyecto

### Fase 1 — Planeación ✅ _(cerrada el 2026-11-06)_

Definir y cerrar las bases antes de escribir código:

- Requisitos funcionales y no funcionales.
- Alcance del MVP.
- Stack tecnológico.
- Arquitectura y modelo de datos.
- Fuentes de datos por tienda.

El trabajo de esta fase se registra en un documento local de planeación (`docs/PLANEACION.md`), excluido del repositorio mediante `.gitignore`. Las decisiones ya cerradas se pasan a este README.

**Salida:** requisitos, stack y arquitectura aprobados.

### Fase 2 — Estructura del proyecto ✅ _(cerrada el 2026-11-07)_

- Inicializar el monorepo con pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`).
- Configurar TypeScript, ESLint, Prettier y Vitest.
- Crear el esqueleto de la API Express (`/api/health`) y de la app web con React Router v8 en modo SSR.
- Configurar variables de entorno y scripts de desarrollo.

**Salida:** un proyecto que arranca y compila, sin lógica de negocio.

**Estado:** monorepo creado. La API responde `/api/health`, la web renderiza en el servidor en español y muestra si la API está conectada. Tipos, lint, pruebas y build pasan.

### Fase 3 — Desarrollo _(actual)_

Esta fase arranca **con datos reales** de las tiendas VTEX (Elektra, Chedraui, OfficeMax y Martí), sin necesidad de registrarse en ninguna. Las **tiendas mock** se usan solo en las pruebas automatizadas: devuelven respuestas grabadas (fixtures) y simulan lentitud o errores para probar la resiliencia.

1. ✅ Implementar el adaptador VTEX genérico y configurar las 4 tiendas.
2. ✅ Crear las tiendas mock y los fixtures para las pruebas.
3. ✅ Implementar `/api/search` con consulta en paralelo, timeouts por tienda y respuesta parcial.
4. ✅ Añadir caché (en memoria en desarrollo, Upstash Redis en Vercel).
5. ✅ Implementar el agrupador por niveles (GTIN, luego marca + modelo, luego título).

**Orden:** primero se termina el backend y se deja funcional; el frontend va al final, cuando la API esté completa, y se construye con skills de diseño.

**Backend**

6. ✅ Mejoras del backend: enlace de salida, búsquedas simultáneas, pausa por tienda, seguridad y OpenAPI.
7. Desplegar la API en Vercel (con Upstash Redis). Preparado; falta crear las cuentas.
8. Sumar Mercado Libre, Amazon (Creators API) y tiendas con afiliados conforme se obtenga acceso.

**Frontend (al final)**

9. ✅ Construir el frontend en React con skills de diseño: buscador, resultados agrupados, meses sin intereses y "cargar más".
10. Desplegar la web en Vercel.

**Estado:** la búsqueda del backend funciona (pasos 1 a 5). `/api/search` consulta las 4 tiendas reales en unos 300 ms, agrupa por GTIN entre tiendas (p. ej. la misma pantalla TCL 65Q5K en Elektra y Chedraui), muestra MSI y pagina con "cargar más". Ya tiene pausa por tienda, seguridad, enlaces de salida validados y documentación OpenAPI (78 pruebas). El frontend ya está construido (paso 9) con el diseño de la pizarra de casa de cambio. Siguiente: desplegar la API y la web en Vercel.
