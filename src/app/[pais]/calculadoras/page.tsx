import { CalculatorIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { CALCULATORS, calculatorPath } from "@/content/calculators";
import { activeCountries, getCountryBySlug } from "@/countries";
import { absoluteUrl, SITE } from "@/lib/site";

type Params = Promise<{ pais: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return activeCountries().map((c) => ({ pais: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ctx = getCountryBySlug((await params).pais);
  if (!ctx) return {};
  const path = `/${ctx.slug}/calculadoras`;
  return {
    title: `Calculadoras laborales y de impuestos para ${ctx.name} | ${SITE.name}`,
    description: `Calculadoras gratis para ${ctx.name}: décimo cuarto mes, aguinaldo, prestaciones laborales, ISR, ISV, horas extra y cuota de préstamo, con resultado al instante.`,
    alternates: { canonical: path, languages: { [ctx.hreflang]: path, "x-default": path } },
    openGraph: {
      type: "website",
      url: path,
      title: `Calculadoras para ${ctx.name}`,
      locale: SITE.ogLocale,
    },
    other: { "geo.region": ctx.code, "geo.placename": ctx.name },
  };
}

export default async function CalculatorsHub({ params }: { params: Params }) {
  const ctx = getCountryBySlug((await params).pais);
  if (!ctx) notFound();
  return (
    <div className="container-page py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Calculadoras para ${ctx.name}`,
          itemListElement: CALCULATORS.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.title,
            url: absoluteUrl(calculatorPath(c.slug, ctx.slug)),
          })),
        }}
      />
      <header className="max-w-3xl">
        <p className="text-sm font-semibold tracking-wide text-brand-strong uppercase">
          Gratis · sin registrarte
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
          Calculadoras laborales y de impuestos para {ctx.name}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Resultados al instante con las mismas reglas de nuestras plantillas de Excel. Cuando
          necesites hacerlo para toda tu planilla, descarga la plantilla.
        </p>
      </header>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CALCULATORS.map((c) => (
          <Link
            key={c.slug}
            href={calculatorPath(c.slug, ctx.slug)}
            className="group rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <CalculatorIcon className="size-6 text-brand" aria-hidden />
            <h2 className="mt-3 font-heading text-lg font-bold group-hover:text-brand-strong">
              {c.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
