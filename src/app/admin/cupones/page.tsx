import { CouponForm, CouponToggle } from "@/components/admin/coupon-admin";
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

interface CouponRow {
  code: string;
  percent_off: number;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  applies_to: string[];
  duration_months: number;
  provider_codes: Record<string, string>;
  active: boolean;
}

export default async function AdminCouponsPage() {
  const db = requireServiceSupabase();
  const { data } = await db
    .from("coupons")
    .select(
      "code, percent_off, max_redemptions, times_redeemed, expires_at, applies_to, duration_months, provider_codes, active",
    )
    .order("created_at", { ascending: false });
  const coupons = (data ?? []) as CouponRow[];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Vence</TableHead>
              <TableHead>Aplica a</TableHead>
              <TableHead>Paddle</TableHead>
              <TableHead className="text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.code}>
                <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                <TableCell>
                  {c.percent_off} %
                  {c.percent_off === 100
                    ? ` · ${c.duration_months} ${c.duration_months === 1 ? "mes" : "meses"}`
                    : ""}
                </TableCell>
                <TableCell className="tabular-nums">
                  {c.times_redeemed}
                  {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                </TableCell>
                <TableCell>
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("es-HN") : "—"}
                </TableCell>
                <TableCell>{c.applies_to.length ? c.applies_to.join(", ") : "Todo"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {c.provider_codes?.paddle ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={c.active ? "free" : "outline"} className="mr-2">
                    {c.active ? "Activo" : "Inactivo"}
                  </Badge>
                  <CouponToggle code={c.code} active={c.active} />
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Sin cupones.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <aside className="h-fit rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">Nuevo cupón</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Con tarjeta (Paddle), el descuento se aplica con un descuento creado en Paddle: pega su id
          (dsc_…). En transferencias se aplica el porcentaje directamente. Un cupón del 100 % activa
          el plan sin pago durante los meses indicados.
        </p>
        <div className="mt-4">
          <CouponForm />
        </div>
      </aside>
    </div>
  );
}
