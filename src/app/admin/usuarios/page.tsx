import { GrantPlanForm } from "@/components/admin/grant-plan-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireServiceSupabase } from "@/lib/billing/service-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PLAN_LABEL: Record<string, string> = { pro: "Pro", negocio: "Negocio" };

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const db = requireServiceSupabase();
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = (data?.users ?? [])
    .filter((u) => !q || (u.email ?? "").toLowerCase().includes(q))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 100);
  const ids = users.map((u) => u.id);
  const now = new Date().toISOString();
  const { data: ents } = ids.length
    ? await db
        .from("entitlements")
        .select("user_id, kind, ref, valid_until, source")
        .in("user_id", ids)
        .or(`valid_until.is.null,valid_until.gt.${now}`)
    : { data: [] };
  const byUser = new Map<string, { plans: string[]; templates: number; until: string | null }>();
  for (const e of (ents ?? []) as {
    user_id: string;
    kind: string;
    ref: string;
    valid_until: string | null;
  }[]) {
    const row = byUser.get(e.user_id) ?? { plans: [], templates: 0, until: null };
    if (e.kind === "plan") {
      row.plans.push(e.ref);
      if (!row.until || (e.valid_until && e.valid_until > row.until)) row.until = e.valid_until;
    } else row.templates += 1;
    byUser.set(e.user_id, row);
  }

  return (
    <div className="space-y-4">
      <form className="flex max-w-md gap-2" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por correo"
          aria-label="Buscar por correo"
        />
      </form>
      <p className="text-sm text-muted-foreground">
        {users.length} usuarios{q ? ` que coinciden con «${q}»` : " (más recientes)"}.
      </p>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Correo</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Plan vigente</TableHead>
              <TableHead>Compras</TableHead>
              <TableHead className="text-right">Cortesía</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const info = byUser.get(u.id);
              const plan = info?.plans.includes("negocio")
                ? "negocio"
                : info?.plans.includes("pro")
                  ? "pro"
                  : null;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString("es-HN")}</TableCell>
                  <TableCell>
                    {plan ? (
                      <Badge variant="pro">
                        {PLAN_LABEL[plan]}
                        {info?.until
                          ? ` · hasta ${new Date(info.until).toLocaleDateString("es-HN")}`
                          : ""}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Gratis</Badge>
                    )}
                  </TableCell>
                  <TableCell>{info?.templates ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <GrantPlanForm userId={u.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
