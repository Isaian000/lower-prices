/**
 * Pide a la tienda una miniatura en vez de la imagen completa.
 * Las tiendas VTEX aceptan el tamaño en la ruta: /arquivos/ids/123/x.jpg → /arquivos/ids/123-160-160/x.jpg
 * Con cualquier otra URL la devuelve igual.
 */
export function thumbnailUrl(url: string, size: number): string {
  return url.replace(/(\/arquivos\/ids\/\d+)(\/)/, `$1-${size}-${size}$2`);
}
