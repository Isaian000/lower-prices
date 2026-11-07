import type { HealthResponse } from "@lower-prices/shared";

// Solo se ejecuta en el servidor (sufijo .server): la URL de la API no llega al navegador.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function fetchApiHealth(timeoutMs = 1500): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}
