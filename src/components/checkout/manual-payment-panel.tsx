"use client";

import { CheckCircle2Icon, CopyIcon, Loader2Icon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { uploadPaymentProof } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatUsd } from "@/config/plans";
import type { CheckoutResult } from "@/payments/types";

type ManualResult = Extract<CheckoutResult, { type: "manual" }>;

function formatLocal(amount: number, currency: string): string {
  if (currency === "HNL")
    return `L ${new Intl.NumberFormat("es-HN", { minimumFractionDigits: 2 }).format(amount)}`;
  return new Intl.NumberFormat("es-HN", { style: "currency", currency }).format(amount);
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate font-medium tabular-nums">{value}</dd>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Copiar ${label.toLowerCase()}`}
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => toast.success("Copiado"));
        }}
      >
        <CopyIcon />
      </Button>
    </div>
  );
}

/** Instrucciones de transferencia y subida del comprobante. */
export function ManualPaymentPanel({ result, title }: { result: ManualResult; title: string }) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const i = result.instructions;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("paymentId", result.paymentId);
    const res = await uploadPaymentProof(formData);
    setSending(false);
    if (res.ok) setDone(true);
    else toast.error(res.error);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-brand" aria-hidden />
        <h2 className="mt-3 font-heading text-xl font-bold">¡Recibimos tu comprobante!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lo revisamos en horario hábil (normalmente el mismo día) y te avisamos por correo. Tu
          referencia es <strong className="text-foreground">{result.reference}</strong>.
        </p>
        <Button asChild className="mt-5">
          <Link href="/cuenta/suscripcion">Ver estado del pago</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">1. Transfiere o deposita</h2>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        <dl className="mt-4 divide-y">
          <CopyRow label="Monto" value={formatLocal(result.amountLocal, result.localCurrency)} />
          <CopyRow label="Banco" value={i.bankName} />
          <CopyRow label="Titular" value={i.accountHolder} />
          <CopyRow label={i.accountType} value={i.accountNumber} />
          <CopyRow label="Referencia (escríbela en la descripción)" value={result.reference} />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Equivale a {formatUsd(result.amountUsd)} al tipo de cambio de referencia.
          {i.extra ? ` ${i.extra}` : ""}
        </p>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-heading text-lg font-bold">2. Sube el comprobante</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="comprobante">Captura o PDF del comprobante</Label>
            <Input
              id="comprobante"
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              required
            />
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP o PDF de hasta 4 MB.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="Ej.: depósito en agencia, a nombre de…"
            />
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? <Loader2Icon className="animate-spin" /> : <UploadIcon />}
            Enviar comprobante
          </Button>
          <p className="text-xs text-muted-foreground">
            ¿Lo subes después? Encontrarás este pago en{" "}
            <Link href="/cuenta/suscripcion" className="underline">
              Mi suscripción
            </Link>
            .
          </p>
        </form>
      </section>
    </div>
  );
}
