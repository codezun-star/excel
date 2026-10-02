import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave SECRETA (rol de servicio): ignora RLS.
 * Solo se usa en el servidor para lo que el usuario no puede hacer por sí
 * mismo: registrar descargas, procesar webhooks, aprobar pagos, etc.
 */
let cached: SupabaseClient | null | undefined;

export function serviceEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isServiceConfigured(): boolean {
  return serviceEnv() !== null;
}

export function createServiceSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const env = serviceEnv();
  cached = env
    ? createClient(env.url, env.key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;
  return cached;
}

/** Igual que createServiceSupabase, pero falla si falta la configuración. */
export function requireServiceSupabase(): SupabaseClient {
  const client = createServiceSupabase();
  if (!client) throw new Error("Falta SUPABASE_SECRET_KEY o NEXT_PUBLIC_SUPABASE_URL");
  return client;
}
