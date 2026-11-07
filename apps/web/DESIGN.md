---
name: lower-prices
description: La pizarra de una casa de cambio para comparar precios entre tiendas mexicanas.
colors:
  board: "#0e2a5c"
  board-deep: "#091d42"
  board-raised: "#15387a"
  joint: "#2b4f8c"
  joint-strong: "#4569a8"
  letter: "#ffffff"
  letter-dim: "#a9c1e8"
  letter-faint: "#7f9cca"
  amber: "#ffb000"
  amber-ink: "#241800"
  red: "#ff6a5e"
  green: "#3ddc84"
  led-off: "rgb(255 255 255 / 0.1)"
typography:
  display:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.4rem + 3vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.02em"
    fontVariation: '"wdth" 72'
  headline:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.625rem, 1.2rem + 1.8vw, 2.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
    fontVariation: '"wdth" 72'
  price:
    fontFamily: "Doto Variable, ui-monospace, monospace"
    fontSize: "clamp(1.375rem, 1.1rem + 0.9vw, 1.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.02em"
    fontFeature: "tnum"
  title:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: '"wdth" 100'
  body-lg:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "0.01em"
    fontVariation: '"wdth" 70'
  tag:
    fontFamily: "Archivo Variable, Arial Narrow, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    fontVariation: '"wdth" 75'
rounded:
  module: "3px"
  inner: "2px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
components:
  search-slot:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.letter}"
    rounded: "{rounded.module}"
    height: "3.5rem"
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.inner}"
    padding: "0 1.25rem"
  button-primary-hover:
    backgroundColor: "#ffc233"
    textColor: "{colors.amber-ink}"
  button-load-more:
    backgroundColor: "{colors.letter}"
    textColor: "{colors.board}"
    rounded: "{rounded.module}"
    padding: "0 1.5rem"
    height: "3rem"
  button-load-more-hover:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
  chip-example:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.letter}"
    rounded: "{rounded.module}"
    padding: "0 1rem"
    height: "2.75rem"
  switch-option:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.letter-dim}"
    rounded: "{rounded.inner}"
    padding: "0 1rem"
    height: "2.75rem"
  switch-option-active:
    backgroundColor: "{colors.letter}"
    textColor: "{colors.board}"
  board-column-header:
    backgroundColor: "{colors.board-raised}"
    textColor: "{colors.letter}"
    typography: "{typography.label}"
    padding: "0.75rem 1rem"
  board-cell:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.letter}"
    typography: "{typography.price}"
    padding: "1rem"
  board-cell-lowest:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.amber}"
    typography: "{typography.price}"
    padding: "1rem"
  board-cell-empty:
    backgroundColor: "{colors.board-deep}"
    textColor: "{colors.led-off}"
    typography: "{typography.price}"
    padding: "1rem"
  brand-mark:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.inner}"
    size: "1.75rem"
---

# Design System: lower-prices

## Overview

**Creative North Star: "La pizarra de la casa de cambio"**

Cada producto se lee como una divisa en el tablero de una casa de cambio: una fila por producto, una columna por tienda, y el mejor precio encendido. La página entera es el tablero: un azul marino continuo, módulos más oscuros separados por juntas de 1px, letras blancas de rotulación y precios en dígitos de matriz de puntos. Nada flota; todo está empotrado en el tablero.

La densidad es la de un instrumento, no la de un escaparate. La información se alinea en una rejilla con columnas compartidas (subgrid) para que los precios de una misma tienda queden en la misma vertical y se comparen de un vistazo. En celular, cada fila apila sus tiendas bajo el producto sin perder el módulo, la junta ni el dígito.

El sistema rechaza la cuadrícula de tarjetas de producto con botón "ver oferta". No hay sombras, degradados ni tema claro: el tablero es oscuro por naturaleza (`color-scheme: dark`, un solo tema).

**Key Characteristics:**

- Tablero azul marino a página completa; módulos `board-deep` separados por juntas `joint` de 1px.
- Archivo variable con eje de ancho: condensado (70–75) para encabezados y etiquetas, normal (100) para texto.
- Doto (matriz de puntos) solo para precios, siempre montado sobre sus segmentos apagados.
- Ámbar = precio más bajo. Verde y rojo solo en lámparas y estados de tienda.
- Plano: profundidad por tono y juntas, nunca por sombra.

## Colors

Un tablero azul de tres tonos, letras blancas en tres intensidades y cuatro señales luminosas con un solo significado cada una.

### Primary

- **Ámbar de tablero** (`amber`): la luz que señala. En los datos significa una sola cosa: el precio más bajo de la fila (dígitos encendidos y la etiqueta "Más bajo"). En el marco de la interfaz es la luz de acción y de foco: botón de búsqueda, marca, anillo de foco, borde de la ranura con foco, selección de texto, cursor, subrayado al pasar y enlace "saltar al contenido".
- **Tinta sobre ámbar** (`amber-ink`): texto sobre cualquier placa ámbar.

### Secondary

- **Rojo de falla** (`red`): agotado, tienda que no respondió, en pausa o con error, y el aviso de falla parcial (como borde de 1px, no como relleno).
- **Verde de lámpara** (`green`): únicamente la lámpara de una tienda que respondió.

### Neutral

- **Tablero** (`board`): fondo de página.
- **Módulo hundido** (`board-deep`): celdas, filas, ranura de búsqueda, fichas, franja superior.
- **Franja elevada** (`board-raised`): encabezados de columna y fondo de hover en módulos.
- **Junta** (`joint`): divisores de 1px entre módulos, bordes de módulo, barras de carga.
- **Junta marcada** (`joint-strong`): borde de la ranura de búsqueda en reposo, subrayado de enlaces, barra de scroll.
- **Letra** (`letter`): texto principal y dígitos encendidos normales.
- **Letra tenue** (`letter-dim`): texto de apoyo, metadatos, etiquetas de sección.
- **Letra débil** (`letter-faint`): marcador de posición, precio agotado, aro de lámpara en reposo. Solo texto breve.
- **Segmento apagado** (`led-off`): los dígitos fantasma "8" detrás de cada precio y las celdas vacías.

### Named Rules

**La Regla del Ámbar Único.** Dentro del tablero de datos, el ámbar significa "precio más bajo" y nada más: no hay avisos ámbar, ni celdas inundadas de ámbar, ni otros datos en ámbar. El precio más bajo es dígito ámbar sobre el mismo módulo oscuro, más la etiqueta de texto "Más bajo" (el color nunca es la única señal).

**La Regla de las Lámparas.** Verde solo para "respondió"; rojo solo para fallas. Ninguno de los dos se usa como decoración ni como acento.

## Typography

**Display Font:** Archivo Variable (con Arial Narrow, system-ui)
**Body Font:** Archivo Variable, eje `wdth` 100
**Label/Mono Font:** Doto Variable (con ui-monospace), solo precios

Ambas familias se sirven desde el propio sitio con `@fontsource-variable` (Archivo con eje de ancho, Doto).

**Character:** Archivo hace de rotulación de tablero: se condensa para encabezados y nombres de tienda, y se abre a ancho normal para leer. Doto es el dígito luminoso de matriz de puntos; su presencia significa "esto es un precio".

### Hierarchy

- **Display** (800, `wdth` 72, interlineado 0.98): titular del inicio, máx. 18ch.
- **Headline** (800, `wdth` 72, interlineado 1.05): título de resultados, títulos de estados (sin resultados, falla) y de la página de error.
- **Price** (Doto 800, cifras tabulares): todos los precios. El precio más bajo sube a 900 y se enciende en ámbar.
- **Title** (600, 1rem, interlineado 1.3): nombre del producto en la fila, recortado a 3 líneas.
- **Body** (400, 1rem, interlineado 1.5, `wdth` 100): texto corrido. **Body-lg** (1.25rem) para subtítulos y cuerpos de estado, 50–52ch.
- **Label** (700, 0.875rem, `wdth` 70): encabezados de columna del tablero y nombres de tienda.
- **Tag** (700, 0.8125rem, `wdth` 75): "Más bajo", "Agotado". Los metadatos de 0.8125rem (descuento, MSI, tipo de agrupamiento) usan 400–600 con `wdth` 80–85.

### Named Rules

**La Regla del Dígito.** Doto es exclusivo de precios. Ningún título, etiqueta ni número que no sea un precio usa la matriz de puntos.

**La Regla del Ancho.** La jerarquía se marca con el eje de ancho y el peso, no con mayúsculas ni tracking amplio: condensado (70–75) = rótulo, 80–85 = dato secundario y botones, 100 = lectura.

**La Regla del Aviso Blanco.** Un agrupamiento por nombre parecido se avisa en `letter` peso 600, nunca en ámbar ni en rojo.

## Layout

Contenedor centrado de `82rem` con medianil fluido `clamp(1rem, 3vw, 2.5rem)`. El tablero es una rejilla: columna de producto `minmax(17rem, 2.4fr)` más una columna por tienda `minmax(8.5rem, 1fr)`; encabezados, filas y celdas heredan las columnas con `subgrid`, así los precios quedan alineados por tienda. El fondo de la rejilla es `joint` con `gap: 1px`: las juntas son el espacio entre módulos, no bordes dibujados.

Las celdas de precio se alinean a la derecha. Ritmo de espacio en pasos de 0.25rem (escala `spacing`); el padding de módulo es 1rem (0.75rem en celular). Objetivos táctiles de al menos 2.75rem.

Puntos de corte: `56rem` (el tablero pasa a filas apiladas: cada producto es un bloque con borde de junta y su lista de tiendas debajo, con nombre de tienda a la izquierda y precio a la derecha; las celdas sin oferta se ocultan), `40rem` (la franja superior envuelve la búsqueda a ancho completo), `30rem` (el botón de búsqueda queda solo con icono; el interruptor de orden ocupa todo el ancho).

## Elevation & Depth

Plano por completo. No hay `box-shadow` ni degradados en ningún componente. La profundidad es tonal: `board` (página) → `board-deep` (módulos hundidos) → `board-raised` (franjas y hover). Las juntas de 1px en `joint` separan los módulos.

### Named Rules

**La Regla del Tablero Plano.** Si algo necesita destacar, se enciende (color de letra o de dígito) o cambia de tono de módulo; nunca se levanta con sombra.

## Shapes

Esquinas casi rectas, como módulos atornillados. El tablero y los contenedores usan esquina de módulo (`rounded.module`); lo que va dentro de un módulo (botón dentro de la ranura, opción del interruptor, miniatura, marca, barras de carga) usa la esquina interior (`rounded.inner`). No hay píldoras ni círculos salvo las lámparas.

Las fotos de las tiendas tienen fondo blanco: se montan como etiqueta blanca de 5rem (4rem en celular) con 5px de margen interior y `object-fit: contain`. No hay imágenes propias.

## Components

### Buttons

Placas de tablero, firmes y sin adorno.

- **Shape:** esquina interior dentro de la ranura (`rounded.inner`), esquina de módulo cuando va suelto (`rounded.module`).
- **Primary (buscar):** placa ámbar con tinta ámbar, 700, `wdth` 85, icono de lupa en trazo de 2.25; va empotrada en la ranura con 0.25rem de margen.
- **Load more:** placa blanca `letter` con texto `board`, alto 3rem, mínimo 16rem; al pasar se enciende en ámbar. Deshabilitado: `letter-dim`.
- **Hover / Focus:** hover solo en `(hover: hover) and (pointer: fine)`. Al presionar, `scale(0.97)` en 140ms con `cubic-bezier(0.23, 1, 0.32, 1)`. Foco: contorno ámbar de 3px a 2px de distancia. Mientras busca, la lupa parpadea en dos pasos.

### Chips

- **Style:** fichas de ejemplo como letreros sueltos: módulo `board-deep`, borde `joint` de 1px, 600, alto 2.75rem.
- **State:** al pasar, el borde se enciende en ámbar; al presionar, `scale(0.97)`.

### Cards / Containers

No hay tarjetas. El único contenedor es el módulo del tablero.

- **Corner Style:** `rounded.module`.
- **Background:** `board-deep` sobre juntas `joint`.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** 1px `joint`; el aviso de falla parcial usa 1px `red`.
- **Internal Padding:** 1rem (0.75rem en celular).

### Inputs / Fields

- **Style:** la ranura de búsqueda es un letrero empotrado: `board-deep`, borde 1px `joint-strong`, `rounded.module`, texto 1.25rem peso 500. Tres tamaños: normal (3.5rem), inicio (4.25rem, texto fluido hasta 1.625rem) y compacto en la franja superior (2.75rem, 1rem).
- **Focus:** el borde de toda la ranura pasa a ámbar; el campo no dibuja contorno propio.

### Navigation

- **Franja superior:** `board-deep` con junta inferior, alto mínimo 3.75rem; marca a la izquierda y, en resultados, la búsqueda compacta (máx. 36rem).
- **Interruptor de orden:** enlaces (funciona sin JavaScript) dentro de una caja `board-deep` con 2px de relleno; opción en `letter-dim` 600 `wdth` 80; al pasar, `board-raised`; activa, placa blanca con texto `board`.

### Precio LED (componente firma)

Cada precio son dígitos Doto encendidos montados sobre sus segmentos apagados en la misma celda de rejilla: el fantasma es el mismo texto con cada dígito cambiado por "8" en `led-off`, oculto a lectores de pantalla.

- **Normal:** dígitos `letter`.
- **Más bajo:** dígitos ámbar 900 sobre el mismo módulo oscuro, más la etiqueta "Más bajo" en `tag` ámbar.
- **Agotado:** dígitos `letter-faint` tachados con línea `red` de 2px, más la etiqueta "Agotado" en rojo.
- **Celda vacía:** un módulo apagado con "$8,888" en `led-off`; nunca una raya. En celular las celdas vacías se ocultan.
- **Carga:** filas de dígitos apagados que respiran en dos pasos (1.4s) y barras de texto en `joint`.
- **Llegada:** un solo parpadeo de "refresco" en los dígitos de las filas nuevas (300ms, tres pasos, opacidad a 0.25 a la mitad), escalonado por fila (55ms) y columna (35ms). Parte y termina visible: si la animación no corre, el precio se lee igual.

### Lámpara de tienda

SVG de 0.875rem, decorativo; el estado siempre va también en texto.

- **Respondió:** punto lleno verde.
- **No respondió a tiempo:** aro hueco rojo.
- **Error o en pausa:** aro rojo tachado en diagonal.
- **Sin consultar:** punto tenue lleno (blanco al 28%), nunca un aro, para no confundirse con "no respondió".

### Marca

Signo "$" dibujado como matriz de puntos de 5×7 (SVG propio, círculos de radio 1.55) en una placa ámbar de 1.75rem con tinta ámbar, junto al nombre en Archivo 800 `wdth` 75. El nombre vive en configuración; la marca no depende de él.

## Do's and Don'ts

### Do:

- **Do** montar cada precio sobre sus segmentos apagados (`led-off`) y usar celdas apagadas "$8,888" donde una tienda no tiene oferta.
- **Do** marcar el precio más bajo con dígitos ámbar sobre el módulo oscuro normal y la etiqueta de texto "Más bajo".
- **Do** separar módulos con juntas de 1px (`gap: 1px` sobre fondo `joint`), no con sombras ni espacios grandes.
- **Do** usar el eje de ancho de Archivo para la jerarquía: 70–75 en rótulos, 100 en texto.
- **Do** limitar el hover a `(hover: hover) and (pointer: fine)` y usar `scale(0.97)` al presionar botones y fichas.
- **Do** respetar `prefers-reduced-motion`: todas las animaciones y transiciones se reducen a 0.01ms de forma global.
- **Do** acompañar cada color de estado (lámpara, ámbar, rojo) con texto.

### Don't:

- **Don't** usar ámbar para avisos, advertencias ni celdas rellenas; dentro de los datos solo significa precio más bajo.
- **Don't** usar Doto para nada que no sea un precio.
- **Don't** dibujar celdas vacías con rayas ni guiones; son módulos apagados.
- **Don't** representar "sin consultar" con un aro: el aro hueco significa "no respondió a tiempo".
- **Don't** agregar sombras, degradados ni un tema claro.
- **Don't** convertir los resultados en tarjetas de producto con botón "ver oferta".
- **Don't** mostrar logos de tiendas ni imágenes que no vengan de la tienda; los nombres de tienda van en texto.
