---
version: 1
slug: "app-routes-home-tsx"
primary_target: "app/routes/home.tsx"
related_targets: ["app/routes/search.tsx"]
---

# Búsqueda y resultados (inicio y /buscar)

Scope: la experiencia completa de búsqueda: inicio (`/`) y resultados (`/buscar?q=`), con sus estados. Modo: Operate.

Audiencia y tarea: comprador en México, en celular o computadora, que escribe un producto y quiere saber en qué tienda está más barato el mismo producto. Acción: buscar, comparar las etiquetas, ir a la tienda. Estados: cargando, sin resultados, falla parcial (tienda sin respuesta / en pausa), falla total, cargar más, agotado.

Restricciones fijadas por el autor (2026-11-07): minimalista; blanco o variantes como tono principal; tipografía de precios muy legible (nada de fuentes de fantasía); el diseño debe funcionar con más de 4 tiendas (nada de una columna por tienda). Textos en i18n `es-MX`, CSS Modules con tokens, SSR, WCAG 2.2 AA, sin logos de tiendas.

## Direction contract

THESIS: Cada oferta es una etiqueta de anaquel: el precio grande y claro manda, la tienda y los meses sin intereses van en letra chica. Rechaza la tarjeta de producto con botón «Ver oferta» y la matriz de una columna por tienda.

OWN-WORLD: Página blanca (#FFFFFF) con filos grises de un pixel (#DEDEDA); tinta casi negra (#111111) y gris (#5E5E5E) para lo secundario; una sola letra de trabajo, Public Sans, con cifras tabulares en precios; etiquetas blancas de esquinas apenas redondeadas; la franja amarilla (#FFD60A) existe solo encima de la etiqueta del mejor precio, con el texto «Mejor precio», y en la marca, que dibuja una etiqueta con esa franja. Sin sombras de adorno ni degradados.

STORY: La persona entiende de inmediato que se busca en varias tiendas a la vez, escribe el producto, ve en cada producto sus etiquetas ordenadas de la más barata a la más cara con la mejor marcada, despliega las demás tiendas si quiere, entiende si alguna tienda no respondió, y sale a la tienda.

FIRST VIEWPORT: Inicio: nombre arriba a la izquierda; al centro-izquierda un titular corto y el buscador ancho con borde fino y botón negro; debajo fichas de búsquedas de ejemplo y la línea con las tiendas que se consultan. Resultados: buscador compacto arriba; título de la búsqueda; una franja con el resumen de tiendas («4 de 4 tiendas respondieron», detalle desplegable) y el orden a la derecha; luego cada producto: foto, nombre e identidad a la izquierda, y a la derecha una fila de etiquetas de precio (3 visibles, «Ver N tiendas más»). En celular las etiquetas van como renglones a todo el ancho bajo el producto (tienda y detalles a la izquierda, precio alineado a la derecha): así un precio de seis cifras más sus MSI caben a 390 px y los precios se comparan en una sola columna (principio 4 de PRODUCT.md). Cada etiqueta lleva una flecha de salida junto a la tienda y el signo de pesos más chico que los dígitos. Señal: «Ver N tiendas más» despliega las etiquetas restantes en el mismo lugar con un movimiento corto; al cargar se ven etiquetas vacías grises.

FORM: Etiqueta de anaquel, candidato 1 de mi lista ordenada (elegido por el usuario como IMPECCABLE’S PICK en la segunda ronda), seed key 2bba4a11 (re-roll 1).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Decisiones abiertas: filtros de precio y tienda en la interfaz quedan fuera de esta versión (la API ya los soporta).
