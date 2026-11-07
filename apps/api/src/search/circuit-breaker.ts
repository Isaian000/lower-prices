/**
 * Pausa automática por tienda ("circuit breaker").
 * Tras `threshold` fallas seguidas, la tienda se deja de consultar durante
 * `cooldownMs`. Pasado ese tiempo se prueba una vez: si responde, vuelve a la
 * normalidad; si falla, se pausa de nuevo.
 *
 * El estado vive en memoria del proceso. En Vercel cada instancia lleva su propia
 * cuenta, lo cual basta para no hacer esperar a los usuarios por una tienda caída.
 */
export interface CircuitBreakerOptions {
  threshold: number;
  cooldownMs: number;
  now?: () => number;
}

interface State {
  failures: number;
  pausedUntil: number;
}

export function createCircuitBreaker(options: CircuitBreakerOptions) {
  const now = options.now ?? Date.now;
  const states = new Map<string, State>();

  function state(id: string): State {
    let current = states.get(id);
    if (!current) {
      current = { failures: 0, pausedUntil: 0 };
      states.set(id, current);
    }
    return current;
  }

  return {
    /** true si la tienda está en pausa y no debe consultarse. */
    isPaused(id: string): boolean {
      return state(id).pausedUntil > now();
    },

    recordSuccess(id: string): void {
      states.set(id, { failures: 0, pausedUntil: 0 });
    },

    recordFailure(id: string): void {
      const current = state(id);
      current.failures++;
      if (current.failures >= options.threshold) {
        current.pausedUntil = now() + options.cooldownMs;
      }
    },
  };
}

export type CircuitBreaker = ReturnType<typeof createCircuitBreaker>;
