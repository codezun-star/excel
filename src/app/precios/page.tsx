import type { Metadata } from "next";

import { Faq } from "@/components/landing/faq";
import { PlansGrid } from "@/components/pricing/plans-grid";
import {
  BILLING_DEFAULTS,
  DEFAULT_ONE_TIME,
  DEFAULT_PLANS,
  formatHnl,
  formatUsd,
} from "@/config/plans";

export const metadata: Metadata = {
  title: "Precios y planes | Excel Codezun",
  description:
    "Plan Gratis, Pro y Negocio/Contador. Plantillas de Excel con fórmulas reales para Honduras y Latinoamérica.",
  alternates: { canonical: "/precios" },
};

export default function PricingPage() {
  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold">Planes simples, plantillas que se pagan solas</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Empieza gratis. Pásate a Pro cuando necesites planillas, impuestos y configuraciones
          guardadas.
        </p>
      </header>
      <div className="mt-10">
        <PlansGrid
          plans={DEFAULT_PLANS}
          exchangeRate={BILLING_DEFAULTS.exchangeRateUsdHnl}
          ctas={{
            free: {
              monthly: { label: "Empezar gratis", href: "/plantillas" },
              yearly: { label: "Empezar gratis", href: "/plantillas" },
            },
          }}
        />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Solo necesitas una plantilla Pro una vez? Cómprala por{" "}
        {formatUsd(DEFAULT_ONE_TIME.priceUsd)} (≈ {formatHnl(DEFAULT_ONE_TIME.priceUsd)}). Precios
        en dólares; el equivalente en lempiras es una referencia.
      </p>
      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="text-center text-2xl font-extrabold">Preguntas frecuentes</h2>
        <div className="mt-6">
          <Faq />
        </div>
      </section>
    </div>
  );
}
