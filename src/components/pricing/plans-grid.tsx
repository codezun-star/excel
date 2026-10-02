"use client";

import { CheckIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatHnl,
  formatUsd,
  yearlySavings,
  type BillingCycle,
  type PlanDefinition,
} from "@/config/plans";
import { cn } from "@/lib/utils";

export interface PlanCta {
  label: string;
  href?: string;
  disabled?: boolean;
}

export function PlansGrid({
  plans,
  exchangeRate,
  ctas,
}: {
  plans: PlanDefinition[];
  exchangeRate: number;
  /** Botón de cada plan por ciclo (datos serializables desde el servidor) */
  ctas: Record<string, Record<BillingCycle, PlanCta>>;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const maxSaving = Math.max(...plans.map(yearlySavings));
  return (
    <div>
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Ciclo de facturación"
          className="inline-flex rounded-full bg-muted p-1"
        >
          {(["monthly", "yearly"] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                cycle === c ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {c === "monthly" ? "Mensual" : "Anual"}
              {c === "yearly" && maxSaving > 0 && (
                <Badge variant="pro" className="ml-2">
                  Ahorra hasta {maxSaving} %
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const price = cycle === "monthly" ? plan.priceMonthlyUsd : plan.priceYearlyUsd;
          const cta = ctas[plan.code]?.[cycle] ?? { label: "Próximamente", disabled: true };
          const saving = yearlySavings(plan);
          return (
            <div
              key={plan.code}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6",
                plan.highlight && "border-brand shadow-lg ring-4 ring-brand/20",
              )}
            >
              {plan.highlight && (
                <Badge variant="pro" className="absolute -top-3 left-6">
                  <SparklesIcon />
                  Más elegido
                </Badge>
              )}
              <h3 className="text-xl font-extrabold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <div className="mt-5">
                {price ? (
                  <>
                    <span className="font-heading text-4xl font-extrabold tabular-nums">
                      {formatUsd(price)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      /{cycle === "monthly" ? "mes" : "año"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      ≈ {formatHnl(price, exchangeRate)}{" "}
                      {cycle === "yearly" && saving > 0 ? `· ahorras ${saving} %` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-heading text-4xl font-extrabold">Gratis</span>
                    <p className="mt-1 text-xs text-muted-foreground">Para siempre</p>
                  </>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild={Boolean(cta.href) && !cta.disabled}
                className="mt-6 w-full"
                variant={plan.highlight ? "default" : "outline"}
                disabled={cta.disabled}
              >
                {cta.href && !cta.disabled ? (
                  <Link href={cta.href}>{cta.label}</Link>
                ) : (
                  <span>{cta.label}</span>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
