"use client";

import { CheckIcon, Loader2Icon, TagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatHnl, formatUsd } from "@/config/plans";
import type { CountryCode } from "@/countries";
import { cn } from "@/lib/utils";
import type { ProviderOption } from "@/payments/registry";
import type { CheckoutItem, CheckoutResult, ProviderId } from "@/payments/types";

import { ManualPaymentPanel } from "./manual-payment-panel";

export interface CheckoutSummary {
  item: CheckoutItem;
  title: string;
  detail: string;
  features: string[];
  priceUsd: number;
  exchangeRate: number;
  country: CountryCode;
}

type AppliedCoupon = { code: string; percentOff: number; finalPriceUsd: number };
type ManualResult = Extract<CheckoutResult, { type: "manual" }>;

export function CheckoutForm({
  summary,
  providers,
}: {
  summary: CheckoutSummary;
  providers: ProviderOption[];
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderId>(providers[0]!.id);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [manual, setManual] = useState<ManualResult | null>(null);

  const total = coupon ? coupon.finalPriceUsd : summary.priceUsd;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: summary.item, code: couponInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setCoupon({
          code: data.code,
          percentOff: data.percentOff,
          finalPriceUsd: data.finalPriceUsd,
        });
      } else {
        setCoupon(null);
        setCouponError(data.error ?? "Cupón no válido");
      }
    } catch {
      setCouponError("No se pudo validar el cupón");
    } finally {
      setCheckingCoupon(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: summary.item,
          provider,
          couponCode: coupon?.code ?? null,
          country: summary.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo iniciar el pago");
        return;
      }
      if (data.type === "redirect") {
        window.location.assign(data.url);
        return;
      }
      if (data.type === "granted") {
        toast.success("¡Listo! Tu cupón activó el plan.");
        router.push("/cuenta/suscripcion?pago=cupon");
        return;
      }
      if (data.type === "manual") setManual(data as ManualResult);
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (manual) return <ManualPaymentPanel result={manual} title={summary.title} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-6">
        <fieldset className="rounded-xl border bg-card p-5">
          <legend className="-ml-1 px-1 font-heading text-base font-bold">Medio de pago</legend>
          <div role="radiogroup" className="mt-2 grid gap-3">
            {providers.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  provider === p.id ? "border-brand bg-brand-soft/60" : "hover:bg-accent",
                )}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={provider === p.id}
                  onChange={() => setProvider(p.id)}
                  className="mt-1 accent-[var(--brand)]"
                />
                <span>
                  <span className="block font-semibold">{p.label}</span>
                  <span className="block text-sm text-muted-foreground">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="rounded-xl border bg-card p-5">
          <legend className="-ml-1 px-1 font-heading text-base font-bold">Cupón</legend>
          <div className="mt-2 flex gap-2">
            <div className="grid flex-1 gap-1.5">
              <Label htmlFor="cupon" className="sr-only">
                Código de cupón
              </Label>
              <Input
                id="cupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Ej.: LANZAMIENTO20"
                maxLength={40}
                autoComplete="off"
                aria-invalid={couponError ? true : undefined}
                aria-describedby={couponError ? "cupon-error" : undefined}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={applyCoupon}
              disabled={checkingCoupon || !couponInput.trim()}
            >
              {checkingCoupon ? <Loader2Icon className="animate-spin" /> : <TagIcon />}
              Aplicar
            </Button>
          </div>
          {couponError && (
            <p id="cupon-error" role="alert" className="mt-2 text-sm text-destructive">
              {couponError}
            </p>
          )}
          {coupon && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-strong">
              <CheckIcon className="size-4" /> {coupon.code}: {coupon.percentOff} % de descuento
              aplicado
            </p>
          )}
        </fieldset>
      </section>

      <aside className="h-fit rounded-xl border bg-card p-5 lg:sticky lg:top-20">
        <h2 className="font-heading text-lg font-bold">{summary.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{summary.detail}</p>
        {summary.features.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {summary.features.map((f) => (
              <li key={f} className="flex gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        )}
        <dl className="mt-5 space-y-1 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Precio</dt>
            <dd className="tabular-nums">{formatUsd(summary.priceUsd)}</dd>
          </div>
          {coupon && (
            <div className="flex justify-between text-brand-strong">
              <dt>
                Cupón <Badge variant="outline">{coupon.code}</Badge>
              </dt>
              <dd className="tabular-nums">−{formatUsd(summary.priceUsd - total)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatUsd(total)}</dd>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <dt>Referencia en lempiras</dt>
            <dd className="tabular-nums">≈ {formatHnl(total, summary.exchangeRate)}</dd>
          </div>
        </dl>
        <Button className="mt-5 w-full" size="lg" onClick={submit} disabled={submitting}>
          {submitting && <Loader2Icon className="animate-spin" />}
          {total <= 0 ? "Activar con cupón" : "Continuar al pago"}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Tu acceso se activa cuando el pago se confirma. Nunca guardamos los datos de tu tarjeta.
        </p>
      </aside>
    </div>
  );
}
