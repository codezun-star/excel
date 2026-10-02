import { InfoIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/account-nav";
import { PendingProofUpload } from "@/components/account/pending-proof-upload";
import {
  PaymentProcessingRefresher,
  RedeemCouponForm,
  SubscriptionButtons,
} from "@/components/account/subscription-actions";
import { NotConfiguredNotice } from "@/components/auth/not-configured";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/config/plans";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { createServiceSupabase } from "@/lib/billing/service-client";
import { defaultUsageStore } from "@/lib/billing/usage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import { describePayment } from "@/payments/describe";
import { getTemplateMeta } from "@/templates/catalog";

export const metadata: Metadata = {
  title: "Mi suscripción | Excel Codezun",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

const PROVIDER_LABEL: Record<string, string> = {
  paddle: "Tarjeta (Paddle)",
  paypal: "PayPal",
  manual: "Transferencia",
  coupon: "Cupón",
  admin: "Cortesía",
  tilopay: "Tilopay",
};
const STATUS: Record<string, { label: string; variant: "free" | "pro" | "outline" }> = {
  active: { label: "Activa", variant: "free" },
  past_due: { label: "Pago pendiente", variant: "pro" },
  canceled: { label: "Cancelada", variant: "outline" },
  pending: { label: "Pendiente", variant: "pro" },
};
const PAYMENT_STATUS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

/** La fecha ya pasó (se evalúa en cada solicitud: la página es dinámica). */
function isPast(iso: unknown): boolean {
  return typeof iso === "string" && new Date(iso).getTime() < Date.now();
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-HN", { dateStyle: "long" }) : "—";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SubscriptionPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  if (!isSupabaseConfigured()) {
    return (
      <div className="container-page max-w-2xl py-12">
        <h1 className="text-3xl font-extrabold">Mi suscripción</h1>
        <div className="mt-6">
          <NotConfiguredNotice />
        </div>
      </div>
    );
  }
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/cuenta/suscripcion");
  const { user } = session;
  const ent = await getUserEntitlements(user.id);
  const db = createServiceSupabase();
  const used = await defaultUsageStore().get({ userId: user.id, anonId: null });

  const [subs, payments] = db
    ? await Promise.all([
        db
          .from("subscriptions")
          .select(
            "id, plan_code, billing_cycle, status, provider, current_period_end, cancel_at_period_end, provider_customer_id, created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        db
          .from("manual_payments")
          .select(
            "id, kind, plan_code, billing_cycle, template_slug, amount, reference, status, proof_url, rejection_reason, created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ])
    : [{ data: [] }, { data: [] }];

  const processing = sp.pago === "procesando";

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="mb-4 text-3xl font-extrabold">Mi suscripción</h1>
      <AccountNav showClients={ent.limits.clientProfiles > 1} />
      <PaymentProcessingRefresher
        active={processing && ent.plan === "free" && ent.templates.length === 0}
      />

      {processing && (
        <Alert variant="info" className="mb-6">
          <InfoIcon />
          <AlertDescription>
            Estamos confirmando tu pago con el procesador. Tu acceso se activa automáticamente en
            cuanto llegue la confirmación (normalmente unos segundos). Esta página se actualiza
            sola.
          </AlertDescription>
        </Alert>
      )}
      {sp.pago === "error" && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            No pudimos completar el pago. No se hizo ningún cargo; intenta de nuevo o elige otro
            medio.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Plan actual</p>
          <p className="mt-1 font-heading text-2xl font-extrabold">{ent.planName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ent.plan === "free"
              ? "Plantillas gratis con límite mensual."
              : ent.planValidUntil
                ? `Acceso hasta el ${fmtDate(ent.planValidUntil)}.`
                : "Acceso sin vencimiento."}
          </p>
          {ent.plan === "free" ? (
            <Button asChild className="mt-4" variant="highlight">
              <Link href="/precios">Ver planes Pro</Link>
            </Button>
          ) : null}
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Descargas este mes</p>
          <p className="mt-1 font-heading text-2xl font-extrabold tabular-nums">
            {used}
            {ent.downloadLimit !== null ? ` de ${ent.downloadLimit}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            El contador se reinicia el primer día de cada mes.
          </p>
        </div>
      </section>

      {ent.templates.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Plantillas compradas</h2>
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {ent.templates.map((t) => {
              const meta = getTemplateMeta(t.slug);
              return (
                <li
                  key={t.slug}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
                >
                  <span className="font-medium">{meta?.title ?? t.slug}</span>
                  <span className="text-muted-foreground">
                    Disponible hasta el {fmtDate(t.validUntil)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold">Suscripciones</h2>
        {subs.data?.length ? (
          <ul className="mt-3 grid gap-3">
            {subs.data.map((s) => {
              const status = STATUS[String(s.status)] ?? STATUS.pending!;
              const renewing = s.status === "active" && !s.cancel_at_period_end;
              const ended = isPast(s.current_period_end);
              return (
                <li key={String(s.id)} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      Plan {s.plan_code === "negocio" ? "Negocio / Contador" : "Pro"} ·{" "}
                      {s.billing_cycle === "yearly" ? "anual" : "mensual"}
                    </p>
                    <Badge variant={status.variant}>{ended ? "Vencida" : status.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {PROVIDER_LABEL[String(s.provider)] ?? String(s.provider)} ·{" "}
                    {renewing ? "Se renueva el " : ended ? "Terminó el " : "Termina el "}
                    {fmtDate(s.current_period_end as string | null)}
                    {s.provider === "manual" && !ended ? " (sin renovación automática)" : ""}
                  </p>
                  {(s.provider === "paddle" || s.provider === "paypal") && !ended && (
                    <div className="mt-3">
                      <SubscriptionButtons
                        subscriptionId={String(s.id)}
                        canCancel={renewing}
                        hasPortal
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Todavía no tienes suscripciones.</p>
        )}
      </section>

      {payments.data && payments.data.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Pagos por transferencia</h2>
          <ul className="mt-3 grid gap-3">
            {payments.data.map((p) => (
              <li key={String(p.id)} className="rounded-xl border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {describePayment(p as Parameters<typeof describePayment>[0])}
                  </p>
                  <Badge
                    variant={
                      p.status === "approved" ? "free" : p.status === "rejected" ? "outline" : "pro"
                    }
                  >
                    {PAYMENT_STATUS[String(p.status)]}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Referencia <strong className="text-foreground">{String(p.reference)}</strong> ·{" "}
                  {formatUsd(Number(p.amount))} · {fmtDate(p.created_at as string)}
                </p>
                {p.status === "rejected" && p.rejection_reason && (
                  <p className="mt-1 text-destructive">Motivo: {String(p.rejection_reason)}</p>
                )}
                {p.status === "pending" &&
                  (p.proof_url ? (
                    <p className="mt-1">Comprobante recibido: lo estamos revisando.</p>
                  ) : (
                    <div className="mt-3">
                      <PendingProofUpload paymentId={String(p.id)} />
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-dashed p-5">
        <RedeemCouponForm />
      </section>
    </div>
  );
}
