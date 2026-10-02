"use client";

import { CheckIcon, LockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatHnl, formatUsd } from "@/config/plans";

import { reportEvent } from "./use-access";

export type PaywallReason =
  "pro_required" | "limit_reached" | "login_required" | "save_requires_plan" | "feature";

export interface PaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: PaywallReason;
  loggedIn: boolean;
  templateSlug?: string;
  templateTitle?: string;
  oneTimePriceUsd?: number;
  /** Límite mensual alcanzado (para el texto) */
  limit?: number | null;
  /** Texto propio para reason="feature" */
  featureText?: string;
}

const PRO_BENEFITS = [
  "Todas las plantillas Pro: planilla, ISV, ISR, prestaciones…",
  "Descargas sin límite razonable",
  "Guarda configuraciones y regenera en un clic",
  "Tu logo y sin marca de agua",
];

function copy(p: PaywallProps): { title: string; description: string } {
  switch (p.reason) {
    case "pro_required":
      return {
        title: `${p.templateTitle ?? "Esta plantilla"} es Pro`,
        description: "Desbloquéala con el plan Pro (todas las plantillas) o cómprala por separado.",
      };
    case "limit_reached":
      return p.loggedIn
        ? {
            title: "Llegaste a tu límite de descargas del mes",
            description: `Tu plan gratis incluye ${p.limit ?? 5} descargas al mes. Con Pro descargas sin preocuparte.`,
          }
        : {
            title: "Usaste tus descargas sin cuenta",
            description:
              "Crea una cuenta gratis y obtén más descargas cada mes. Toma menos de un minuto.",
          };
    case "login_required":
      return {
        title: "Crea tu cuenta gratis para descargar",
        description: "Con una cuenta gratis tienes descargas cada mes y acceso a tu historial.",
      };
    case "save_requires_plan":
      return {
        title: "Guarda tus configuraciones con Pro",
        description:
          "Guarda tus datos una vez y regenera la plantilla cada mes en un clic, con las tasas al día.",
      };
    case "feature":
      return { title: "Función de los planes de pago", description: p.featureText ?? "" };
  }
}

/** Muro de pago reutilizable: explica qué se desbloquea y lleva a la opción correcta. */
export function Paywall(props: PaywallProps) {
  const { open, onOpenChange, reason, loggedIn, templateSlug } = props;
  const { title, description } = copy(props);

  useEffect(() => {
    if (open) reportEvent("paywall_view", templateSlug, { reason });
  }, [open, reason, templateSlug]);

  const next = typeof window === "undefined" ? "/" : window.location.pathname;
  const track = (cta: string) => () => reportEvent("upgrade_click", templateSlug, { reason, cta });
  const needsAccount = !loggedIn && (reason === "login_required" || reason === "limit_reached");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-highlight/20 text-highlight-strong">
            {reason === "pro_required" ? <LockIcon /> : <SparklesIcon />}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {!needsAccount && (
          <ul className="space-y-1.5 text-sm">
            {PRO_BENEFITS.map((b) => (
              <li key={b} className="flex gap-2">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {needsAccount ? (
            <>
              <Button asChild size="lg" onClick={track("registro")}>
                <Link href={`/registro?next=${encodeURIComponent(next)}`}>Crear cuenta gratis</Link>
              </Button>
              <Button asChild variant="outline" onClick={track("login")}>
                <Link href={`/login?next=${encodeURIComponent(next)}`}>Ya tengo cuenta</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" variant="highlight" onClick={track("precios")}>
                <Link href="/precios">Ver planes Pro</Link>
              </Button>
              {reason === "pro_required" && templateSlug && props.oneTimePriceUsd ? (
                <Button asChild variant="outline" onClick={track("compra-unica")}>
                  <Link href={`/checkout?plantilla=${templateSlug}`}>
                    Comprar solo esta por {formatUsd(props.oneTimePriceUsd)} (≈{" "}
                    {formatHnl(props.oneTimePriceUsd)})
                  </Link>
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
