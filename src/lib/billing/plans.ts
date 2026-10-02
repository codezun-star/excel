import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/supabase/env";

import { catalogFromRows, DEFAULT_CATALOG, type PlanCatalog, type PlanRow } from "./plans-core";
import { createServiceSupabase } from "./service-client";

const TTL_MS = 5 * 60 * 1000;
let memo: { at: number; value: PlanCatalog } | null = null;

/**
 * Planes, precios y límites vigentes. Se leen de la tabla `plans` (caché de
 * 5 minutos en memoria) y, si la base no está disponible, se usan los valores
 * por defecto de src/config/plans.ts.
 */
export async function getPlanCatalog(): Promise<PlanCatalog> {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.value;
  const value = await loadCatalog();
  memo = { at: Date.now(), value };
  return value;
}

/** Para pruebas o después de editar planes desde /admin. */
export function invalidatePlanCatalog(): void {
  memo = null;
}

async function loadCatalog(): Promise<PlanCatalog> {
  const env = supabaseEnv();
  const client =
    createServiceSupabase() ??
    (env ? createClient(env.url, env.key, { auth: { persistSession: false } }) : null);
  if (!client) return DEFAULT_CATALOG;
  try {
    const { data, error } = await client
      .from("plans")
      .select(
        "code, name, description, price_monthly_usd, price_yearly_usd, price_once_usd, limits, features, highlight, sort_order",
      )
      .eq("active", true)
      .order("sort_order");
    if (error || !data?.length) return DEFAULT_CATALOG;
    return catalogFromRows(data as PlanRow[]);
  } catch {
    return DEFAULT_CATALOG;
  }
}
