---
version: 1
slug: "app-routes-home-tsx"
primary_target: "app/routes/home.tsx"
related_targets: ["app/routes/search.tsx"]
---

# Búsqueda y resultados (inicio y /buscar)

Scope: la experiencia completa de búsqueda: inicio (`/`) y resultados (`/buscar?q=`), con sus estados. Modo: Operate.

Audiencia y tarea: comprador en México, en celular o computadora, que escribe un producto y quiere saber en qué tienda está más barato el mismo producto. Acción: buscar, comparar la fila, ir a la tienda. Estados: cargando, sin resultados, falla parcial (tienda sin respuesta / en pausa), falla total, cargar más, agotado.

Restricciones: textos en i18n `es-MX`, CSS Modules con tokens, SSR, WCAG 2.2 AA, sin imágenes inventadas (solo las de las tiendas), sin logos de tiendas (texto).

## Direction contract

THESIS: Cada producto se lee como una divisa en la pizarra de una casa de cambio: una fila por producto, una columna por tienda, y el mejor precio encendido. Rechaza la cuadrícula de tarjetas de producto con botón "ver oferta" que entrega todo comparador.

OWN-WORLD: Tablero azul marino (#0E2A5C) a página completa con módulos más oscuros por fila; letras de tablero blancas en Archivo (ancho condensado para encabezados de columna, normal para texto); precios en dígitos de matriz de puntos (Doto) blancos, y el más bajo de cada fila en ámbar (#FFB000); lámparas de estado por tienda (llena, hueca, tachada); divisores como juntas finas entre módulos; sin sombras ni degradados.

STORY: La persona ve de inmediato que la página consulta varias tiendas a la vez, escribe su producto, lee en cada fila qué tienda tiene el precio más bajo y si hay meses sin intereses, entiende si alguna tienda no respondió, y sale a la tienda.

FIRST VIEWPORT: Inicio: el tablero vacío listo para usarse; arriba una franja con el nombre; al centro-izquierda el titular corto y la ranura de búsqueda ancha como letrero intercambiable; debajo, los encabezados de columna con las 4 tiendas y su lámpara, y búsquedas de ejemplo como fichas. Resultados: franja de búsqueda compacta arriba, tira de estado de tiendas, controles de orden como interruptores, y filas: producto a la izquierda, columnas de precio por tienda a la derecha; en celular cada fila apila la lista de tiendas bajo el producto. Señal: al llegar resultados, los dígitos de cada fila se encienden en secuencia una sola vez (reducido: aparecen sin movimiento); al cargar, los módulos muestran dígitos apagados.

FORM: Pizarra de casa de cambio, candidato 1 de mi lista ordenada (elegido por el usuario como IMPECCABLE’S PICK), seed key 2bba4a11.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Decisiones abiertas: filtros de precio y tienda en la interfaz quedan fuera de esta primera versión (la API ya los soporta).
