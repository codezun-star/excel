import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/account-nav";
import { AccountTabs } from "@/components/account/account-tabs";
import { ProfileForm } from "@/components/account/profile-form";
import { EmptyState, SavedConfigs, type SavedConfigItem } from "@/components/account/saved-configs";
import { NotConfiguredNotice } from "@/components/auth/not-configured";
import { TemplateCard } from "@/components/catalog/template-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { canonicalTemplatePath } from "@/lib/seo";
import { getTemplateMeta } from "@/templates/catalog";
import type { TemplateMeta } from "@/templates/types";

export const metadata: Metadata = { title: "Mi cuenta | Excel Codezun", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-page max-w-2xl py-12">
        <h1 className="text-3xl font-extrabold">Mi cuenta</h1>
        <div className="mt-6">
          <NotConfiguredNotice />
        </div>
      </div>
    );
  }
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/cuenta");
  const { supabase, user } = session;

  const [{ data: profile }, { data: configs }, { data: downloads }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, country, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("saved_configs")
      .select("id, name, template_slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("downloads")
      .select("id, template_slug, country, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const entitlements = await getUserEntitlements(user.id);

  const items: SavedConfigItem[] = (configs ?? []).flatMap((c) => {
    const meta = getTemplateMeta(c.template_slug as string);
    if (!meta) return [];
    return [
      {
        id: c.id as string,
        name: c.name as string,
        templateTitle: meta.title,
        href: canonicalTemplatePath(meta),
        updatedAt: c.updated_at as string,
      },
    ];
  });
  const myTemplates = Array.from(new Set((configs ?? []).map((c) => c.template_slug as string)))
    .map((slug) => getTemplateMeta(slug))
    .filter((m): m is TemplateMeta => Boolean(m));

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="text-sm text-muted-foreground">Hola,</p>
        <h1 className="text-3xl font-extrabold">
          {(profile?.full_name as string | null) ?? user.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan: <strong className="text-foreground">{entitlements.planName}</strong> ·{" "}
          <Link
            href={entitlements.plan === "free" ? "/precios" : "/cuenta/suscripcion"}
            className="font-medium text-brand-strong hover:underline"
          >
            {entitlements.plan === "free" ? "Ver planes" : "Administrar"}
          </Link>
        </p>
      </header>
      <AccountNav showClients={entitlements.limits.clientProfiles > 1} />
      <AccountTabs
        tabs={[
          {
            id: "plantillas",
            label: "Mis plantillas",
            content: myTemplates.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myTemplates.map((t) => (
                  <TemplateCard key={t.slug} meta={t} />
                ))}
              </div>
            ) : (
              <EmptyState text="Las plantillas para las que guardes una configuración aparecerán aquí." />
            ),
          },
          {
            id: "configuraciones",
            label: "Configuraciones",
            content: <SavedConfigs items={items} />,
          },
          {
            id: "descargas",
            label: "Descargas",
            content: downloads?.length ? (
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plantilla</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {downloads.map((d) => {
                      const meta = getTemplateMeta(d.template_slug as string);
                      return (
                        <TableRow key={d.id as number}>
                          <TableCell>
                            {meta ? (
                              <Link href={canonicalTemplatePath(meta)} className="hover:underline">
                                {meta.title}
                              </Link>
                            ) : (
                              String(d.template_slug)
                            )}
                          </TableCell>
                          <TableCell>{String(d.country)}</TableCell>
                          <TableCell>
                            {new Date(d.created_at as string).toLocaleString("es-HN")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState text="Todavía no hay descargas registradas con tu cuenta." />
            ),
          },
          {
            id: "perfil",
            label: "Perfil",
            content: (
              <ProfileForm
                fullName={(profile?.full_name as string | null) ?? ""}
                country={(profile?.country as string | null) ?? "HN"}
                email={user.email ?? ""}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
