import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireServiceSupabase } from "@/lib/billing/service-client";
import { canonicalTemplatePath } from "@/lib/seo";
import { getTemplateMeta } from "@/templates/catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const RANGES = [7, 30, 90] as const;

/** Fecha ISO de hace `days` días (la página es dinámica: se evalúa por solicitud). */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export default async function AdminDownloadsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const days = RANGES.find((d) => String(d) === sp.dias) ?? 30;
  const since = daysAgo(days);
  const db = requireServiceSupabase();
  const [{ data: downloads }, { data: paywalls }] = await Promise.all([
    db
      .from("downloads")
      .select("template_slug, user_id, source")
      .gte("created_at", since)
      .limit(50_000),
    db
      .from("events")
      .select("template_slug")
      .eq("name", "paywall_view")
      .gte("created_at", since)
      .limit(50_000),
  ]);

  type Row = {
    slug: string;
    total: number;
    users: number;
    anon: number;
    server: number;
    paywall: number;
  };
  const rows = new Map<string, Row>();
  const get = (slug: string) => {
    let r = rows.get(slug);
    if (!r) {
      r = { slug, total: 0, users: 0, anon: 0, server: 0, paywall: 0 };
      rows.set(slug, r);
    }
    return r;
  };
  for (const d of (downloads ?? []) as {
    template_slug: string;
    user_id: string | null;
    source: string;
  }[]) {
    const r = get(d.template_slug);
    r.total += 1;
    if (d.user_id) r.users += 1;
    else r.anon += 1;
    if (d.source !== "browser") r.server += 1;
  }
  for (const p of (paywalls ?? []) as { template_slug: string | null }[]) {
    if (p.template_slug) get(p.template_slug).paywall += 1;
  }
  const sorted = [...rows.values()].sort((a, b) => b.total - a.total || b.paywall - a.paywall);
  const total = sorted.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{total}</strong> descargas en los últimos {days} días.
        </p>
        <nav className="flex gap-1" aria-label="Rango">
          {RANGES.map((d) => (
            <Link
              key={d}
              href={`/admin/descargas?dias=${d}`}
              className={`rounded-md px-3 py-1.5 text-sm ${d === days ? "bg-muted font-semibold" : "text-muted-foreground"}`}
            >
              {d} días
            </Link>
          ))}
        </nav>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plantilla</TableHead>
              <TableHead className="text-right">Descargas</TableHead>
              <TableHead className="text-right">Con cuenta</TableHead>
              <TableHead className="text-right">Anónimas</TableHead>
              <TableHead className="text-right">Servidor / lote</TableHead>
              <TableHead className="text-right">Vistas del paywall</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => {
              const meta = getTemplateMeta(r.slug);
              return (
                <TableRow key={r.slug}>
                  <TableCell>
                    {meta ? (
                      <Link
                        href={canonicalTemplatePath(meta)}
                        className="font-medium hover:underline"
                      >
                        {meta.title}
                      </Link>
                    ) : (
                      r.slug
                    )}{" "}
                    {meta?.tier === "pro" && <Badge variant="pro">Pro</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{r.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.users}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.anon}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.server}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.paywall}</TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Sin descargas en este período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
