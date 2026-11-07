# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Compradores en México que ya saben qué producto quieren y buscan en qué tienda en línea está más barato. Hay dos situaciones de uso, sin prioridad entre ellas:

- **Búsqueda rápida en celular**, sobre todo en temporadas de ofertas (Buen Fin, Hot Sale): escriben el producto, ven el precio más bajo y se van a la tienda.
- **Comparación con calma en computadora** antes de una compra grande (pantalla, laptop, línea blanca): revisan cada tienda, el descuento, la disponibilidad y los meses sin intereses.

No hay cuentas de usuario en el MVP.

## Product Purpose

Buscar un producto una sola vez y compararlo en varias tiendas mexicanas a la vez, sin entrar tienda por tienda. El éxito es que la persona encuentre en segundos dónde comprar el mismo producto al mejor precio y llegue a la tienda con confianza.

## Positioning

- **El mismo producto, agrupado:** las ofertas de distintas tiendas que corresponden al mismo producto se muestran juntas, con el precio más bajo y el más alto, en lugar de una lista revuelta. Cada grupo indica con qué certeza se agrupó (código de barras, marca + modelo o título parecido).
- **Neutral y honesto:** no hay tiendas patrocinadas ni anuncios disfrazados. El orden lo deciden la relevancia o el precio, nunca un acuerdo comercial. Los enlaces de afiliado (a futuro) no cambian el orden ni lo que se muestra.

## Operating Context

- Temporadas de ofertas con mucho tráfico y prisa; también uso cotidiano.
- Las tiendas responden a distinta velocidad o pueden fallar: la página muestra lo que llegó y avisa qué tienda no respondió.
- Los resultados llegan por bloques ("cargar más"), no en páginas numeradas.
- La persona termina siempre en el sitio de la tienda: la app no vende ni cobra.

## Capabilities and Constraints

- Tiendas actuales: Elektra, Chedraui, OfficeMax y Martí (API pública VTEX). A futuro: Mercado Libre, Amazon y tiendas con afiliados.
- Cada oferta trae: título, imagen, precio, precio anterior y % de descuento (si hay), disponibilidad, meses sin intereses (si la tienda los informa), tienda y enlace.
- Orden: relevancia, precio menor a mayor o mayor a menor. Filtros posibles en la API: tiendas y rango de precio. Sin filtro de categoría en el MVP.
- Solo productos nuevos. Sin costo de envío.
- Estados que la interfaz debe cubrir: cargando, sin resultados, falla parcial (alguna tienda no respondió o está en pausa) y falla total.
- Stack ya decidido: React Router v8 con SSR sobre Express, CSS Modules, i18next (solo `es-MX` por ahora; ningún texto va directo en los componentes), formatos con `Intl` en `es-MX`.
- Las búsquedas (`/buscar?q=`) llevan `noindex`. Las páginas indexables de producto son trabajo futuro.

## Brand Commitments

- El nombre "lower-prices" es provisional; el nombre real se define al final. La identidad visual debe poder cambiar de nombre sin rehacerse (el nombre vive en `app/config.ts`).
- No hay logo, colores ni tipografía previos: el autor delegó la identidad visual al diseño.
- Idioma y tono: español de México, directo y claro.

## Evidence on Hand

- Datos reales de las 4 tiendas vía `/api/search` y respuestas grabadas en `apps/api/src/stores/vtex/__fixtures__/`.
- No hay testimonios, cifras de usuarios, prensa ni logos oficiales de las tiendas: no inventarlos. Los nombres de las tiendas se muestran como texto.

## Product Principles

1. **El precio manda:** lo primero que se lee de cada producto es cuánto cuesta y dónde.
2. **Comparar, no vender:** la interfaz ayuda a decidir; no empuja a ninguna tienda.
3. **Decir la verdad sobre los datos:** si una tienda no respondió, si un agrupamiento es por título parecido o si un producto está agotado, se dice.
4. **Rápido en celular, completo en computadora:** la misma información sirve para decidir en segundos o para revisar con calma.

## Accessibility & Inclusion

WCAG 2.2 AA (RNF-10): navegación completa con teclado, foco visible, contraste suficiente, textos alternativos, respeto a `prefers-reduced-motion`. El linter incluye `eslint-plugin-jsx-a11y`.
