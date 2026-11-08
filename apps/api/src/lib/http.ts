/**
 * Tipos mínimos para `fetch`. No se usa el `Response` global porque `@types/node` lo
 * declara vacío cuando detecta tipos de navegador, y así lo ve el compilador de Vercel:
 * "Property 'ok' does not exist on type 'Response'". Con estos tipos propios compila
 * igual en cualquier configuración, y el `fetch` real (o uno falso en las pruebas)
 * los cumple.
 */
export interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers: { get(name: string): string | null };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export interface HttpRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal | null;
}

export type HttpFetch = (url: string | URL, init?: HttpRequestInit) => Promise<HttpResponse>;

/** El `fetch` global con los tipos de arriba. */
export const httpFetch: HttpFetch = (url, init) =>
  fetch(url, init) as unknown as Promise<HttpResponse>;
