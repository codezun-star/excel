import "server-only";

import type { User } from "@supabase/supabase-js";

import { getCurrentUser } from "@/lib/supabase/server";

import { getUserEntitlementsCached, type UserEntitlements } from "./entitlements";

/** Usuario actual (verificado) y sus entitlements. */
export async function getSessionEntitlements(): Promise<{
  user: User | null;
  entitlements: UserEntitlements;
}> {
  const session = await getCurrentUser();
  const user = session?.user ?? null;
  return { user, entitlements: await getUserEntitlementsCached(user?.id ?? null) };
}
