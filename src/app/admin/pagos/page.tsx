import { PaymentReviewActions } from "@/components/admin/payment-review-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUsd } from "@/config/plans";
import { requireServiceSupabase } from "@/lib/billing/service-client";
import { describePayment } from "@/payments/describe";

interface Row {
  id: string;
  user_id: string;
  kind: string;
  plan_code: string | null;
  billing_cycle: string | null;
  template_slug: string | null;
  amount: number;
  amount_local: number | null;
  local_currency: string | null;
  reference: string;
  coupon_code: string | null;
  proof_url: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_LABEL: Record<Row["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

async function emailsFor(userIds: string[]): Promise<Map<string, string>> {
  const db = requireServiceSupabase();
  const unique = [...new Set(userIds)];
  const results = await Promise.all(unique.map((id) => db.auth.admin.getUserById(id)));
  const map = new Map<string, string>();
  results.forEach((r, i) => {
    if (r.data.user?.email) map.set(unique[i]!, r.data.user.email);
  });
  return map;
}

export default async function AdminPaymentsPage() {
  const db = requireServiceSupabase();
  const columns =
    "id, user_id, kind, plan_code, billing_cycle, template_slug, amount, amount_local, local_currency, reference, coupon_code, proof_url, status, notes, rejection_reason, created_at, reviewed_at";
  const [{ data: pending }, { data: recent }] = await Promise.all([
    db
      .from("manual_payments")
      .select(columns)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100),
    db
      .from("manual_payments")
      .select(columns)
      .neq("status", "pending")
      .order("reviewed_at", { ascending: false })
      .limit(30),
  ]);
  const pendingRows = (pending ?? []) as Row[];
  const recentRows = (recent ?? []) as Row[];
  const emails = await emailsFor([...pendingRows, ...recentRows].map((r) => r.user_id));

  // URLs firmadas de 10 minutos para ver comprobantes del bucket privado.
  const signed = new Map<string, string>();
  await Promise.all(
    pendingRows
      .filter((r) => r.proof_url)
      .map(async (r) => {
        const { data } = await db.storage.from("payment-proofs").createSignedUrl(r.proof_url!, 600);
        if (data?.signedUrl) signed.set(r.id, data.signedUrl);
      }),
  );

  const withProof = pendingRows.filter((r) => r.proof_url);
  const withoutProof = pendingRows.filter((r) => !r.proof_url);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold">
          Por revisar <Badge variant="pro">{withProof.length}</Badge>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifica en tu banca que el monto y la referencia coincidan antes de aprobar. Aprobar crea
          la suscripción o la compra y activa el acceso al instante.
        </p>
        <div className="mt-4 grid gap-4">
          {withProof.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay comprobantes pendientes.
            </p>
          )}
          {withProof.map((r) => (
            <article
              key={r.id}
              className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-heading text-base font-bold">{describePayment(r)}</p>
                <p>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  {emails.get(r.user_id) ?? r.user_id}
                </p>
                <p>
                  <span className="text-muted-foreground">Referencia:</span>{" "}
                  <strong className="tabular-nums">{r.reference}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Monto:</span>{" "}
                  {r.amount_local !== null
                    ? `${r.local_currency} ${Number(r.amount_local).toLocaleString("es-HN")} · `
                    : ""}
                  {formatUsd(Number(r.amount))}
                  {r.coupon_code ? ` (cupón ${r.coupon_code})` : ""}
                </p>
                <p className="text-muted-foreground">
                  Creado el {new Date(r.created_at).toLocaleString("es-HN")}
                </p>
                {r.notes && <p className="rounded-md bg-muted p-2">“{r.notes}”</p>}
                {signed.get(r.id) && (
                  <a
                    href={signed.get(r.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-medium text-brand-strong underline"
                  >
                    Ver comprobante
                  </a>
                )}
              </div>
              <PaymentReviewActions paymentId={r.id} reference={r.reference} />
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Esperando comprobante ({withoutProof.length})</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pagos iniciados sin comprobante. Si ya ves la transferencia en tu banca con esa
          referencia, también puedes aprobarlos.
        </p>
        <PaymentsTable rows={withoutProof} emails={emails} actions />
      </section>

      <section>
        <h2 className="text-xl font-bold">Revisados recientemente</h2>
        <PaymentsTable rows={recentRows} emails={emails} />
      </section>
    </div>
  );
}

function PaymentsTable({
  rows,
  emails,
  actions,
}: {
  rows: Row[];
  emails: Map<string, string>;
  actions?: boolean;
}) {
  if (!rows.length)
    return <p className="mt-3 text-sm text-muted-foreground">No hay pagos en esta lista.</p>;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Referencia</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Compra</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            {actions && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium tabular-nums">{r.reference}</TableCell>
              <TableCell>{emails.get(r.user_id) ?? r.user_id.slice(0, 8)}</TableCell>
              <TableCell>{describePayment(r)}</TableCell>
              <TableCell className="tabular-nums">{formatUsd(Number(r.amount))}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    r.status === "approved" ? "free" : r.status === "rejected" ? "outline" : "pro"
                  }
                >
                  {STATUS_LABEL[r.status]}
                </Badge>
                {r.rejection_reason && (
                  <span className="block text-xs text-muted-foreground">{r.rejection_reason}</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(r.reviewed_at ?? r.created_at).toLocaleDateString("es-HN")}
              </TableCell>
              {actions && (
                <TableCell className="text-right">
                  <PaymentReviewActions paymentId={r.id} reference={r.reference} compact />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
