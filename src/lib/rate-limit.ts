/**
 * Límite de solicitudes en memoria (ventana deslizante). Es una protección
 * básica por instancia: en Vercel cada instancia lleva su propio conteo. Para
 * un límite global, reemplazar por Upstash Redis o similar (misma interfaz).
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now = Date.now(),
): RateLimitResult {
  if (now - lastSweep > 60_000) {
    for (const [k, hits] of buckets) {
      if (!hits.length || now - hits[hits.length - 1]! > windowMs) buckets.delete(k);
    }
    lastSweep = now;
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000)),
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** IP del cliente detrás del proxy de Vercel (o "local"). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return result.ok ? {} : { "Retry-After": String(result.retryAfterSeconds) };
}
