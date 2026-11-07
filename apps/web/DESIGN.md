---
name: lower-prices
description: Comparador de precios para México; cada oferta es una etiqueta de anaquel.
colors:
  paper: "#ffffff"
  paper-soft: "#f5f5f2"
  rule: "#dededa"
  rule-strong: "#b9b9b3"
  ink: "#111111"
  ink-hover: "#2b2b2b"
  ink-muted: "#5e5e5e"
  ink-soft: "#767670"
  best: "#ffd60a"
  best-ink: "#111111"
  alert: "#b42318"
  ok: "#1f7a3d"
typography:
  display:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.6vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.2vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  price:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.2rem + 0.6vw, 1.625rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  title:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  caption:
    fontFamily: "Public Sans Variable, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  label: "4px"
  inset: "3px"
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
  gutter: "clamp(1rem, 3vw, 2.5rem)"
  content-max: "76rem"
components:
  shelf-label:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    padding: "0.75rem 1rem 1rem"
  shelf-label-best-band:
    backgroundColor: "{colors.best}"
    textColor: "{colors.best-ink}"
    typography: "{typography.caption}"
    padding: "0.25rem 1rem"
  search-slot:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    height: "3.5rem"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.inset}"
    padding: "0 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    padding: "0 1.5rem"
    height: "3rem"
  button-secondary-hover:
    backgroundColor: "{colors.paper-soft}"
  chip-example:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    padding: "0 1rem"
    height: "2.75rem"
  sort-option:
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.label}"
    padding: "0 0.75rem"
    height: "2.5rem"
  sort-option-current:
    textColor: "{colors.ink}"
---

# Design System: lower-prices

## Overview

**Creative North Star: "Etiqueta de anaquel"**

Cada oferta es una etiqueta de anaquel de supermercado: un rectángulo blanco con filo fino donde el precio grande y claro manda, y la tienda, el descuento y los meses sin intereses van en letra chica. La página es blanca, la tinta casi negra, y todo lo demás son filos grises de un pixel. El sistema es minimalista por decisión del autor: el blanco y sus variantes son el tono principal, y nada compite con el precio.

La densidad es de lista de comparación, no de catálogo: cada producto es un renglón con su foto, nombre e identidad a la izquierda y sus etiquetas a la derecha, ordenadas de la más barata a la más cara. El sistema escala a cualquier número de tiendas sin cambiar de forma: tres etiquetas visibles y el resto desplegable en el mismo lugar. Nunca hay una columna por tienda.

Rechazos confirmados: la tarjeta de producto con botón «Ver oferta», la matriz de una columna por tienda, las fuentes de fantasía o de matriz de puntos en precios, las sombras de adorno y los degradados. Hay un solo tema claro, por diseño.

**Key Characteristics:**

- Página blanca, tinta casi negra, filos de 1px; sin sombras ni degradados.
- Una sola letra de trabajo (Public Sans), cifras tabulares en todos los precios.
- La etiqueta completa es el enlace de salida a la tienda.
- El amarillo existe solo como franja «Mejor precio» y en la marca.
- Escala a N tiendas: 3 etiquetas visibles, «Ver N tiendas más» para el resto.
- El estado de cada tienda se dice con forma y texto, nunca solo con color.

## Colors

Paleta neutra de papel y tinta con una sola señal amarilla escasa y dos colores de estado funcionales.

### Primary

- **Amarillo de oferta** (`best`): la franja «Mejor precio» encima de la etiqueta más barata disponible, y la franja de la marca. Siempre con tinta (`best-ink`) encima, nunca como fondo de texto blanco.

### Neutral

- **Papel** (`paper`): fondo de página, de etiquetas, del buscador y de los botones secundarios.
- **Papel de apoyo** (`paper-soft`): ranuras de foto, barras de carga, hover del botón secundario, bloque de error técnico.
- **Filo** (`rule`): todos los filos de 1px: etiquetas, renglones de producto, encabezado, pie, fichas de ejemplo.
- **Filo de control** (`rule-strong`): borde del buscador, subrayado en reposo de los enlaces, barra de desplazamiento, marca de tienda en espera.
- **Tinta** (`ink`): texto principal, botón primario, borde de la etiqueta del mejor precio, foco, selección de texto.
- **Tinta al pasar** (`ink-hover`): solo el hover del botón primario.
- **Tinta secundaria** (`ink-muted`): identidad del producto, nombre de tienda en etiquetas normales, subtítulos, metadatos, pie.
- **Tinta suave** (`ink-soft`): marcador del buscador y precio tachado de un agotado; solo texto breve.

### Tertiary

- **Rojo de falla** (`alert`): agotado, tienda que no respondió o está en pausa (aro de la marca y texto del detalle), aviso de falla parcial, error al cargar más.
- **Verde de respuesta** (`ok`): solo el relleno de la marca de tienda que respondió.

### Named Rules

**La Regla del Amarillo Único.** El amarillo aparece en exactamente dos lugares: la franja «Mejor precio» sobre la etiqueta más barata disponible (solo cuando el producto está en más de una tienda) y la marca, que dibuja una etiqueta con esa franja. Ningún otro botón, fondo, resaltado ni selección es amarillo.

**La Regla de la Selección Neutra.** La selección de texto es tinta sobre papel (fondo `ink`, texto `paper`), nunca amarilla.

**La Regla del Blanco Principal.** El blanco y sus variantes (`paper`, `paper-soft`) son el tono dominante de toda superficie. No se introducen fondos de color ni tema oscuro.

## Typography

**Display Font:** Public Sans Variable (con Helvetica Neue, Arial, system-ui)
**Body Font:** Public Sans Variable (misma familia)

**Character:** Una sola letra de trabajo, sobria y de oficina pública; el peso y el tamaño hacen la jerarquía, no el cambio de familia.

### Hierarchy

- **Display** (700, `display`, 1.05, -0.03em): el titular de inicio, uno por página.
- **Headline** (700, `headline`, 1.15, -0.02em): título de la búsqueda, títulos de estado (sin resultados, falla), página de error.
- **Price** (700, `price`, 1.15, -0.015em, tabular-nums, sin cortes de línea): el precio de cada etiqueta. El signo «$» va más chico (0.62em) y elevado (vertical-align 0.42em), como en la etiqueta impresa.
- **Title** (600, 1rem, 1.35): nombre del producto, máximo 3 líneas.
- **Body large** (400, 1.125rem): subtítulos y cuerpo de estados, máximo 50ch.
- **Body** (400, 1rem, 1.5): texto base.
- **Label** (600, 0.875rem): nombre de tienda, resumen de tiendas, orden, «Ver N tiendas más», etiquetas de formulario.
- **Caption** (600–700, 0.8125rem): franja «Mejor precio», MSI, descuento, agotado, coincidencia.

### Named Rules

**La Regla del Precio Legible.** Todo precio va en Public Sans 700 con cifras tabulares. Nunca fuentes de fantasía, de matriz de puntos, condensadas ni de display en precios.

**La Regla de la Letra Única.** No se añade una segunda familia tipográfica. Sin texto en mayúsculas espaciadas ni etiquetas sobre títulos.

## Layout

Columna de contenido con ancho máximo (`content-max`) centrada y medianil fluido (`gutter`). Ritmo de espacio en pasos de 0.25rem (`spacing.1`–`spacing.16`).

- **Renglón de producto:** rejilla de dos columnas (producto `minmax(16rem, 1fr)`, ofertas `minmax(0, 1.55fr)`), separados por filos de 1px arriba y abajo; sin cajas alrededor.
- **Fila de etiquetas (más de 52rem):** tres columnas fijas iguales (`repeat(3, minmax(0, 1fr))`), así la tercera etiqueta nunca queda sola en anchos intermedios.
- **Menos de 52rem:** el producto arriba (foto de 4.5rem) y las etiquetas como renglones a todo el ancho: tienda y detalles a la izquierda, precio alineado a la derecha. Así los precios se comparan en una sola columna.
- **Menos de 40rem:** el buscador del encabezado pasa a ocupar todo el ancho bajo la marca.
- **Menos de 30rem:** el botón de buscar muestra solo el ícono; el orden y «Cargar más» ocupan todo el ancho.
- **Inicio:** bloque de introducción de máximo 44rem, alineado a la izquierda.
- Áreas táctiles de al menos 2.75rem (44px) en controles y enlaces de lista.

### Named Rules

**La Regla de las N Tiendas.** Nunca una columna por tienda. Cada producto muestra 3 etiquetas y un botón «Ver N tiendas más» que despliega las restantes en el mismo lugar. Un producto en una sola tienda lo dice en texto («Solo en 1 de N tiendas») y no lleva franja de mejor precio.

## Elevation & Depth

Sistema plano. No hay `box-shadow` en ningún lugar; la profundidad y la jerarquía se dicen con filos de 1px, el cambio de color del filo (de `rule` a `ink`) y el fondo `paper-soft`. El estado activo de un control es un filo de tinta, no una elevación.

### Named Rules

**La Regla del Filo Fino.** Sin sombras de adorno ni degradados. Si algo necesita destacarse, su filo pasa a tinta.

## Shapes

Esquinas apenas redondeadas (4px, `rounded.label`) en todo: etiquetas, buscador, fichas de ejemplo, opciones de orden, botón secundario, avisos. El botón primario, metido dentro del buscador, usa 3px (`rounded.inset`) para quedar concéntrico con la ranura. Nada de píldoras ni círculos en controles. Los íconos son SVG de trazo propio de 1.5–2px con puntas redondeadas: flecha de salida, lupa, marca de estado y la marca de la etiqueta.

## Components

### Etiqueta de anaquel (componente firma)

Blanca, filo fino, precio grande.

- **Forma:** fondo `paper`, filo 1px `rule`, esquina de 4px, sin sombra.
- **Contenido:** nombre de tienda (Label, `ink-muted`) seguido de una flecha de salida SVG de 0.625rem; luego el precio (Price) con el «$» reducido; debajo descuento, MSI y agotado en Caption.
- **Enlace:** la etiqueta completa es el enlace a la tienda (se abre en otra pestaña, con aviso para lectores de pantalla). No hay botón «Ver oferta».
- **Mejor precio:** franja `best` arriba con el texto «Mejor precio» en Caption 700; el filo de la etiqueta pasa a `ink` y el nombre de tienda a `ink`. Solo en la más barata disponible y solo con más de una tienda.
- **Agotado:** precio en `ink-soft` tachado (2px) y la palabra «Agotado» en `alert`.
- **Hover / Press:** el filo pasa a `ink` (solo con `(hover: hover) and (pointer: fine)`); al presionar escala a 0.98.
- **Carga:** etiquetas vacías con barras `paper-soft` que laten hacia `rule` (1.4s).

### Ver N tiendas más

Botón de texto subrayado (Label, subrayado `rule-strong` que pasa a `ink`). Al desplegar, las etiquetas nuevas entran con opacidad y un desplazamiento de 4px en 220ms (`ease-out`, vía `@starting-style`), escalonadas 30ms.

### Resumen de tiendas

Una sola línea, «X de Y tiendas respondieron», como `<details>` con una flecha dibujada con bordes que gira en 160ms. El detalle es una lista de tiendas con su marca de estado, nombre (600) y detalle. Se abre solo si alguna tienda falló.

### Marca de estado de tienda

Dice el estado con la forma, no solo con el color, y siempre va acompañada de texto: círculo lleno `ok` = respondió; aro punteado `alert` = no respondió a tiempo; aro tachado `alert` = error o en pausa; círculo lleno `rule-strong` = en espera.

### Buttons

- **Primario:** fondo `ink`, texto `paper`, peso 600, 3px de esquina, dentro de la ranura del buscador; hover `ink-hover`; al presionar escala 0.97.
- **Secundario («Cargar más»):** fondo `paper`, filo 1px `ink`, 4px, mínimo 3rem de alto; hover `paper-soft`; al presionar 0.97; deshabilitado con texto `ink-muted` y filo `rule-strong`.

### Chips (búsquedas de ejemplo)

- **Estilo:** filo 1px `rule`, 4px de esquina (sin píldoras), Label a peso 500, 2.75rem de alto.
- **Estado:** hover con filo `ink`; al presionar 0.97.

### Inputs / Fields (buscador)

- **Estilo:** ranura `paper` con filo 1px `rule-strong`, 4px; campo de 3.5rem (4rem en inicio, 2.75rem compacto en el encabezado); marcador en `ink-soft`.
- **Foco:** la ranura completa marca el foco: filo `ink` más contorno de 2px `ink` separado 1px.

### Navigation

- **Encabezado:** filo inferior 1px, marca (SVG de etiqueta con franja amarilla + nombre en 700) a la izquierda y buscador compacto en resultados.
- **Orden:** opciones de texto `ink-muted` con filo transparente; hover filo `rule`; la opción actual en `ink` con filo `ink`.
- **Foco global:** contorno de 2px `ink` separado 2px en todo elemento enfocable.

## Do's and Don'ts

### Do:

- **Do** dejar que la etiqueta completa sea el enlace de salida, con la flecha SVG junto al nombre de la tienda.
- **Do** escribir todo precio en Public Sans 700 con `tabular-nums` y el «$» a 0.62em elevado.
- **Do** mostrar 3 etiquetas por producto y desplegar el resto en el mismo lugar con «Ver N tiendas más».
- **Do** pasar las etiquetas a renglones de ancho completo con el precio a la derecha por debajo de 52rem.
- **Do** decir el estado de cada tienda con forma y texto: lleno, aro punteado, aro tachado.
- **Do** abrir el detalle de tiendas automáticamente cuando alguna falla.
- **Do** condicionar el hover a `(hover: hover) and (pointer: fine)` y usar escala 0.97–0.98 al presionar.
- **Do** respetar `prefers-reduced-motion` globalmente.

### Don't:

- **Don't** usar el amarillo `best` fuera de la franja «Mejor precio» y la marca, ni para la selección de texto.
- **Don't** poner franja de mejor precio cuando el producto está en una sola tienda.
- **Don't** hacer una columna por tienda ni una matriz de comparación.
- **Don't** usar fuentes de fantasía, de matriz de puntos o una segunda familia en precios.
- **Don't** usar sombras de adorno, degradados ni fondos de color.
- **Don't** usar píldoras: fichas y controles llevan 4px de esquina.
- **Don't** indicar estado solo con color.
- **Don't** añadir tema oscuro: un solo tema claro, por diseño.
- **Don't** usar botones «Ver oferta» dentro de la etiqueta, logos de tiendas ni íconos de fuente o glifos.
