import "server-only";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  ANON_COOKIE,
  anonCookieOptions,
  newAnonId,
  signAnonId,
  verifyAnonCookie,
} from "@/lib/billing/anon-id";
import { getUserEntitlements, type UserEntitlements } from "@/lib/billing/entitlements";
import { createServiceSupabase } from "@/lib/billing/service-client";
import { getCurrentUser } from "@/lib/supabase/server";

export interface Requester {
  user: User | null;
  entitlements: UserEntitlements;
  /** Id anónimo firmado (solo visitantes sin sesión) */
  anonId: string | null;
}

/**
 * Quién hace la solicitud: usuario verificado o visitante anónimo con cookie
 * firmada (se crea si no existe; solo en route handlers y server actions).
 */
export async function resolveRequester(options: { createAnon?: boolean } = {}): Promise<Requester> {
  const session = await getCurrentUser();
  const user = session?.user ?? null;
  const entitlements = await getUserEntitlements(user?.id ?? null);
  if (user) return { user, entitlements, anonId: null };

  const jar = await cookies();
  let anonId = verifyAnonCookie(jar.get(ANON_COOKIE)?.value);
  if (!anonId && options.createAnon) {
    anonId = newAnonId();
    jar.set(ANON_COOKIE, signAnonId(anonId), anonCookieOptions());
  }
  return { user: null, entitlements, anonId };
}

/** Marca propia para el plan Negocio: perfil de cliente elegido o nombre de la cuenta. */
export async function resolveBrand(
  requester: Requester,
  clientProfileId?: string | null,
): Promise<{ name: string; footer?: string | null } | null> {
  if (!requester.user || !requester.entitlements.limits.whiteLabel) return null;
  const db = createServiceSupabase();
  if (!db) return null;
  if (clientProfileId) {
    const { data } = await db
      .from("client_profiles")
      .select("name, branding")
      .eq("id", clientProfileId)
      .eq("owner_id", requester.user.id)
      .maybeSingle();
    if (data?.name)
      return {
        name: String(data.name),
        footer: ((data.branding ?? {}) as { footer?: string }).footer ?? null,
      };
  }
  const { data: profile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", requester.user.id)
    .maybeSingle();
  const name = (profile?.full_name as string | null) ?? requester.user.email ?? null;
  return name ? { name } : null;
}
