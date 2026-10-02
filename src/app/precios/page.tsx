import { ShieldCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Faq } from "@/components/landing/faq";
import { CompareTable } from "@/components/pricing/compare-table";
import { PlansGrid, type PlanCta } from "@/components/pricing/plans-grid";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { BILLING_DEFAULTS, formatHnl, formatUsd, type BillingCycle } from "@/config/plans";
import { DEFAULT_COUNTRY } from "@/countries";
import { getPlanCatalog } from "@/lib/billing/plans";
import { SITE, absoluteUrl } from "@/lib/site";
import { providerOptions } from "@/payments/registry";

export const metadata: Metadata = {
  title: "Precios y planes | Excel Codezun",
  description:
    "Plan Gratis, Pro y Negocio/Contador. Plantillas de Excel con fórmulas reales para Honduras y Latinoamérica. Paga con tarjeta o transferencia a BAC, Atlántida o Promerica.",
  alternates: { canonical: "/precios" },
};

// Los precios vienen de la tabla `plans` y se refrescan cada 5 minutos.
export const revalidate = 300;

export default async function PricingPage() {
  const catalog = await getPlanCatalog();
  const providers = providerOptions(DEFAULT_COUNTRY);
  const rate = BILLING_DEFAULTS.exchangeRateUsdHnl;

  const ctas: Record<string, Record<BillingCycle, PlanCta>> = {};
  for (const plan of catalog.plans) {
    if (plan.code === "free") {
      ctas.free = {
        monthly: { label: "Empezar gratis", href: "/plantillas" },
        yearly: { label: "Empezar gratis", href: "/plantillas" },
      };
      continue;
    }
    const cta = (cycle: BillingCycle, price: number | null): PlanCta =>
      price && providers.length
        ? {
            label: `Elegir ${plan.name}`,
            href: `/checkout?plan=${plan.code}&ciclo=${cycle === "yearly" ? "anual" : "mensual"}`,
          }
        : {
            label: price ? "Escríbenos para activarlo" : "Próximamente",
            href: price ? `mailto:${SITE.contactEmail}` : undefined,
            disabled: !price,
          };
    ctas[plan.code] = {
      monthly: cta("monthly", plan.priceMonthlyUsd),
      yearly: cta("yearly", plan.priceYearlyUsd),
    };
  }

  const faq = [
    {
      q: "¿Cómo puedo pagar desde Honduras?",
      a: `Con tarjeta de crédito o débito (Visa, Mastercard, Apple Pay o Google Pay, procesado por Paddle) o con transferencia o depósito a nuestras cuentas en BAC Credomatic, Banco Atlántida o Banco Promerica, desde la app de tu banco, por ACH o en ventanilla. Los precios están en dólares; en transferencias pagas el monto en lempiras al tipo de cambio de referencia de L ${rate.toFixed(2)} por dólar.`,
    },
    {
      q: "¿Cuándo se activa mi plan?",
      a: "Con tarjeta, en cuanto Paddle confirma el pago (normalmente unos segundos). Con transferencia o depósito, cuando revisamos tu comprobante en horario hábil, casi siempre el mismo día.",
    },
    {
      q: "¿Puedo cancelar cuando quiera?",
      a: "Sí. Cancela la renovación desde Mi cuenta → Suscripción y conservas el acceso hasta el final del período que pagaste. Sin llamadas ni formularios.",
    },
    {
      q: "¿Qué pasa con mis archivos si dejo de pagar?",
      a: "Los archivos que descargaste son tuyos y siguen funcionando para siempre. Solo pierdes la posibilidad de generar nuevas plantillas Pro y de usar tus configuraciones guardadas.",
    },
    {
      q: "¿Tienen garantía?",
      a: BILLING_DEFAULTS.refundText,
    },
    {
      q: "¿Guardan los datos de mi tarjeta?",
      a: "No. Los pagos con tarjeta los procesa directamente el proveedor de pagos; nosotros nunca vemos ni guardamos los datos de tu tarjeta.",
    },
    {
      q: "¿Puedo comprar solo una plantilla Pro?",
      a: `Sí: la compra única cuesta ${formatUsd(catalog.oneTime.priceUsd)} e incluye ${catalog.oneTime.accessDays} días para corregir y volver a descargar esa plantilla.`,
    },
    {
      q: "¿Emiten factura?",
      a: `Escríbenos a ${SITE.contactEmail} con tu RTN después de pagar y te enviamos el comprobante correspondiente.`,
    },
  ];

  const offers = catalog.plans
    .filter((p) => p.priceMonthlyUsd)
    .map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.priceMonthlyUsd,
      priceCurrency: "USD",
      url: absoluteUrl("/precios"),
    }));

  return (
    <div className="container-page py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${SITE.name} Pro`,
          description: SITE.description,
          offers,
        }}
      />
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold">Planes simples, plantillas que se pagan solas</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Empieza gratis. Pásate a Pro cuando necesites planillas, impuestos y configuraciones
          guardadas.
        </p>
      </header>
      <div className="mt-10">
        <PlansGrid plans={catalog.plans} exchangeRate={rate} ctas={ctas} />
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          ¿Solo necesitas una plantilla Pro una vez? Cómprala por{" "}
          <strong className="text-foreground">{formatUsd(catalog.oneTime.priceUsd)}</strong> (≈{" "}
          {formatHnl(catalog.oneTime.priceUsd, rate)}) desde la página de la plantilla. Precios en
          dólares; el equivalente en lempiras es una referencia.
        </p>
        {providers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2" aria-label="Medios de pago">
            {providers.map((p) => (
              <Badge key={p.id} variant="outline">
                {p.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <section className="mx-auto mt-12 flex max-w-3xl items-start gap-4 rounded-2xl border border-brand/30 bg-brand-soft p-6">
        <ShieldCheckIcon className="size-8 shrink-0 text-brand" aria-hidden />
        <div>
          <h2 className="text-lg font-bold">Garantía de {BILLING_DEFAULTS.refundDays} días</h2>
          <p className="mt-1 text-sm">{BILLING_DEFAULTS.refundText}</p>
          <Link
            href="/reembolsos"
            className="mt-2 inline-block text-sm font-medium text-brand-strong underline"
          >
            Política de reembolsos
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl">
        <h2 className="text-center text-2xl font-extrabold">Compara los planes</h2>
        <div className="mt-6">
          <CompareTable plans={catalog.plans} />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-center text-2xl font-extrabold">Preguntas frecuentes sobre pagos</h2>
        <div className="mt-6">
          <Faq items={faq} />
        </div>
      </section>
    </div>
  );
}
