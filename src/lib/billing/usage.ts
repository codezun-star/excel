import { createServiceSupabase } from "./service-client";

export interface UsageResult {
  allowed: boolean;
  used: number;
  /** null = sin límite */
  remaining: number | null;
}

export interface UsageKey {
  userId: string | null;
  anonId: string | null;
}

/** Contador mensual de descargas (Supabase en producción, memoria en desarrollo y pruebas). */
export interface UsageStore {
  /** Suma una descarga solo si no supera `limit` (null = sin límite). Atómico. */
  increment(key: UsageKey, limit: number | null): Promise<UsageResult>;
  get(key: UsageKey): Promise<number>;
}

function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function idOf(key: UsageKey): string {
  if ((key.userId === null) === (key.anonId === null))
    throw new Error("Se requiere userId o anonId (solo uno)");
  return key.userId ? `u:${key.userId}` : `a:${key.anonId}`;
}

export function createMemoryUsageStore(): UsageStore {
  const counts = new Map<string, number>();
  return {
    async increment(key, limit) {
      const k = `${idOf(key)}:${monthKey()}`;
      const used = counts.get(k) ?? 0;
      if (limit !== null && used >= limit) return { allowed: false, used, remaining: 0 };
      counts.set(k, used + 1);
      return {
        allowed: true,
        used: used + 1,
        remaining: limit === null ? null : Math.max(limit - used - 1, 0),
      };
    },
    async get(key) {
      return counts.get(`${idOf(key)}:${monthKey()}`) ?? 0;
    },
  };
}

export const supabaseUsageStore: UsageStore = {
  async increment(key, limit) {
    idOf(key);
    const db = createServiceSupabase();
    if (!db) throw new Error("Sin conexión de servicio a Supabase");
    const { data, error } = await db.rpc("increment_download_usage", {
      p_user_id: key.userId,
      p_anon_id: key.anonId,
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    const row = (Array.isArray(data) ? data[0] : data) as UsageResult | undefined;
    if (!row) throw new Error("Respuesta vacía de increment_download_usage");
    return { allowed: row.allowed, used: row.used, remaining: row.remaining };
  },
  async get(key) {
    const db = createServiceSupabase();
    if (!db) return 0;
    const { data } = await db.rpc("get_download_usage", {
      p_user_id: key.userId,
      p_anon_id: key.anonId,
    });
    return Number(data ?? 0);
  },
};

// En desarrollo sin la clave secreta se cuenta en memoria (se reinicia con el servidor).
const devMemoryStore = createMemoryUsageStore();

export function defaultUsageStore(): UsageStore {
  return createServiceSupabase() ? supabaseUsageStore : devMemoryStore;
}
