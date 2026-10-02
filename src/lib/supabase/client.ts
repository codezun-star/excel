"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/** Cliente de Supabase para el navegador (null si no está configurado). */
export function getBrowserSupabase(): SupabaseClient | null {
  const env = supabaseEnv();
  if (!env) return null;
  if (!client) client = createBrowserClient(env.url, env.key);
  return client;
}
