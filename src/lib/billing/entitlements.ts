import "server-only";

import { cache } from "react";

import { isPlanCode, type PlanCatalog } from "./plans-core";
import { getPlanCatalog } from "./plans";
import { createServiceSupabase } from "./service-client";
import {
  resolveEntitlements,
  type EntitlementRow,
  type UserEntitlements,
} from "./entitlements-core";

export type { UserEntitlements } from "./entitlements-core";

/** De dónde salen las filas de entitlements (Supabase en producción, memoria en pruebas). */
export interface EntitlementStore {
  listEntitlements(userId: string, now: Date): Promise<EntitlementRow[]>;
}

export const supabaseEntitlementStore: EntitlementStore = {
  async listEntitlements(userId, now) {
    const client = createServiceSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from("entitlements")
      .select("kind, ref, valid_until, source")
      .eq("user_id", userId)
      .or(`valid_until.is.null,valid_until.gt.${now.toISOString()}`);
    // Ante un error de la base se niega el acceso pagado (falla cerrado).
    if (error) {
      console.error("[entitlements] Error al leer entitlements:", error.message);
      return [];
    }
    return (data ?? []) as EntitlementRow[];
  },
};

/**
 * Plan de desarrollo: con DEV_GRANT_PLAN=pro (o negocio) y fuera de
 * producción, todos los usuarios (incluidos los anónimos) reciben ese plan.
 * Sirve para probar plantillas Pro en local sin Supabase. Se ignora en producción.
 */
export function devGrantRows(): EntitlementRow[] {
  const plan = process.env.DEV_GRANT_PLAN;
  if (process.env.NODE_ENV === "production" || !plan || !isPlanCode(plan)) return [];
  return [{ kind: "plan", ref: plan, valid_until: null, source: "dev:env" }];
}

export interface GetEntitlementsDeps {
  store?: EntitlementStore;
  catalog?: PlanCatalog;
  now?: Date;
}

/**
 * ÚNICA fuente de decisión de acceso. Toda ruta que genere, descargue,
 * guarde o muestre funciones pagadas debe llamar a esta función en el
 * servidor. `userId` null = visitante anónimo (plan gratis con límite anónimo).
 */
export async function getUserEntitlements(
  userId: string | null,
  deps: GetEntitlementsDeps = {},
): Promise<UserEntitlements> {
  const now = deps.now ?? new Date();
  const catalog = deps.catalog ?? (await getPlanCatalog());
  const store = deps.store ?? supabaseEntitlementStore;
  const rows = userId ? await store.listEntitlements(userId, now) : [];
  return resolveEntitlements({ userId, rows: [...rows, ...devGrantRows()], catalog, now });
}

/** Versión memorizada por solicitud para componentes de servidor. */
export const getUserEntitlementsCached = cache((userId: string | null) =>
  getUserEntitlements(userId),
);
