/**
 * Rate Limiter reutilizable para rutas API protegidas.
 * Configurable por ventana de tiempo y máximo de requests.
 */

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export interface RateLimitOptions {
  /** Nombre del store (una instancia por ruta) */
  key: string;
  /** Máximo de requests por ventana */
  maxRequests: number;
  /** Ventana en ms (default: 60s) */
  windowMs?: number;
}

/**
 * Comprueba si un IP/identificador superó el límite.
 * @returns { limited: boolean; remaining: number; resetAt: number }
 */
export function checkRateLimit(
  identifier: string,
  opts: RateLimitOptions,
): { limited: boolean; remaining: number; resetAt: number } {
  const { key, maxRequests, windowMs = 60_000 } = opts;

  if (!stores.has(key)) {
    stores.set(key, new Map());
  }
  const store = stores.get(key)!;
  const now = Date.now();

  const record = store.get(identifier);

  // Nueva ventana o expirada
  if (!record || now - record.windowStart > windowMs) {
    store.set(identifier, { count: 1, windowStart: now });
    return { limited: false, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  record.count += 1;
  const resetAt = record.windowStart + windowMs;

  if (record.count > maxRequests) {
    return { limited: true, remaining: 0, resetAt };
  }

  return { limited: false, remaining: maxRequests - record.count, resetAt };
}

/**
 * Limpia records expirados (llamar periódicamente si el servicio es de larga vida).
 */
export function pruneRateLimitStore(key: string, windowMs = 60_000): void {
  const store = stores.get(key);
  if (!store) return;
  const now = Date.now();
  for (const [id, record] of store.entries()) {
    if (now - record.windowStart > windowMs) store.delete(id);
  }
}
