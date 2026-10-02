import Link from "next/link";

import { requireServiceSupabase } from "@/lib/billing/service-client";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="block transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function AdminHomePage() {
  const db = requireServiceSupabase();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const last30 = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const head = { count: "exact" as const, head: true };

  const [pending, activePlans, downloads, paywall, checkout, paid, users] = await Promise.all([
    db
      .from("manual_payments")
      .select("id", head)
      .eq("status", "pending")
      .not("proof_url", "is", null),
    db
      .from("entitlements")
      .select("ref")
      .eq("kind", "plan")
      .or(`valid_until.is.null,valid_until.gt.${now.toISOString()}`),
    db.from("downloads").select("id", head).gte("created_at", monthStart),
    db.from("events").select("id", head).eq("name", "paywall_view").gte("created_at", last30),
    db.from("events").select("id", head).eq("name", "checkout_start").gte("created_at", last30),
    db.from("events").select("id", head).eq("name", "payment_completed").gte("created_at", last30),
    db.from("profiles").select("id", head),
  ]);

  const byPlan = new Map<string, number>();
  for (const row of (activePlans.data ?? []) as { ref: string }[])
    byPlan.set(row.ref, (byPlan.get(row.ref) ?? 0) + 1);
  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : "—");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Comprobantes por revisar" value={pending.count ?? 0} href="/admin/pagos" />
        <StatCard label="Usuarios registrados" value={users.count ?? 0} href="/admin/usuarios" />
        <StatCard label="Accesos Pro activos" value={byPlan.get("pro") ?? 0} />
        <StatCard label="Accesos Negocio activos" value={byPlan.get("negocio") ?? 0} />
        <StatCard label="Descargas este mes" value={downloads.count ?? 0} href="/admin/descargas" />
      </div>
      <section>
        <h2 className="text-xl font-bold">Embudo de los últimos 30 días</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Vistas del paywall" value={paywall.count ?? 0} />
          <StatCard
            label={`Inicios de pago (${pct(checkout.count ?? 0, paywall.count ?? 0)} del paywall)`}
            value={checkout.count ?? 0}
          />
          <StatCard
            label={`Pagos completados (${pct(paid.count ?? 0, checkout.count ?? 0)} de los inicios)`}
            value={paid.count ?? 0}
          />
        </div>
      </section>
    </div>
  );
}
