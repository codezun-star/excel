import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/account-nav";
import { ClientProfilesManager } from "@/components/account/client-profiles-manager";
import { NotConfiguredNotice } from "@/components/auth/not-configured";
import { Button } from "@/components/ui/button";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { CLIENT_PROFILE_COLUMNS, type ClientProfile } from "@/lib/billing/client-profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clientes | Excel Codezun", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-page max-w-2xl py-12">
        <NotConfiguredNotice />
      </div>
    );
  }
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/cuenta/clientes");
  const ent = await getUserEntitlements(session.user.id);
  const { data } = await session.supabase
    .from("client_profiles")
    .select(CLIENT_PROFILE_COLUMNS)
    .order("name");
  const profiles = (data ?? []) as ClientProfile[];

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="mb-4 text-3xl font-extrabold">Clientes y empresas</h1>
      <AccountNav showClients />
      {ent.limits.clientProfiles < 1 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="font-semibold">Los perfiles de cliente son parte de Pro y Negocio.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Guarda nombre, RTN, logo y datos de cada cliente o sucursal y llénalos en cualquier
            plantilla con un clic. Con Negocio, descarga para varios clientes a la vez.
          </p>
          <Button asChild className="mt-4" variant="highlight">
            <Link href="/precios">Ver planes</Link>
          </Button>
        </div>
      ) : (
        <ClientProfilesManager
          profiles={profiles}
          max={ent.limits.clientProfiles}
          batch={ent.limits.batchDownload}
        />
      )}
    </div>
  );
}
