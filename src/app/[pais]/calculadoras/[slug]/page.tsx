import { ArrowRightIcon, BookOpenIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CalculatorWidget } from "@/components/calculators/calculator-widgets";
import { TemplateCard } from "@/components/catalog/template-card";
import { Faq } from "@/components/landing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { LegalNotice } from "@/components/template/legal-notice";
import { Button } from "@/components/ui/button";
import { getArticle } from "@/content/blog";
import { CALCULATORS, calculatorPath, getCalculator } from "@/content/calculators";
import { activeCountries, getCountryBySlug } from "@/countries";
import { canonicalTemplatePath } from "@/lib/seo";
import { absoluteUrl, SITE } from "@/lib/site";
import { getTemplateMeta } from "@/templates/catalog";

type Params = Promise<{ pais: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return activeCountries().flatMap((ctx) =>
    CALCULATORS.map((c) => ({ pais: ctx.slug, slug: c.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pais, slug } = await params;
  const ctx = getCountryBySlug(pais);
  const calc = getCalculator(slug);
  if (!ctx || !calc) return {};
  const path = calculatorPath(calc.slug, ctx.slug);
  return {
    title: `${calc.seoTitle} | ${SITE.name}`,
    description: calc.description,
    keywords: calc.keywords,
    alternates: { canonical: path, languages: { [ctx.hreflang]: path, "x-default": path } },
    openGraph: {
      type: "website",
      url: path,
      title: calc.seoTitle,
      description: calc.description,
      siteName: SITE.name,
      locale: SITE.ogLocale,
      images: [{ url: `${path}/opengraph-image`, width: 1200, height: 630, alt: calc.title }],
    },
    twitter: { card: "summary_large_image", title: calc.seoTitle, description: calc.description },
    other: { "geo.region": ctx.code, "geo.placename": ctx.name },
  };
}

export default async function CalculatorPage({ params }: { params: Params }) {
  const { pais, slug } = await params;
  const ctx = getCountryBySlug(pais);
  const calc = getCalculator(slug);
  if (!ctx || !calc) notFound();
  const template = getTemplateMeta(calc.template);
  const guide = getArticle(calc.guide);
  const url = absoluteUrl(calculatorPath(calc.slug, ctx.slug));
  const others = CALCULATORS.filter((c) => c.slug !== calc.slug);

  return (
    <div className="container-page py-10">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: calc.title,
            description: calc.description,
            url,
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            inLanguage: ctx.hreflang,
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
            areaServed: { "@type": "Country", name: ctx.name },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: calc.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
              {
                "@type": "ListItem",
                position: 2,
                name: "Calculadoras",
                item: absoluteUrl(`/${ctx.slug}/calculadoras`),
              },
              { "@type": "ListItem", position: 3, name: calc.name, item: url },
            ],
          },
        ]}
      />
      <nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground">
        <Link href={`/${ctx.slug}/calculadoras`} className="hover:underline">
          ← Calculadoras para {ctx.name}
        </Link>
      </nav>
      <header className="mt-4 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{calc.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{calc.intro}</p>
      </header>
      {calc.regulated && (
        <div className="mt-6 max-w-3xl">
          <LegalNotice
            subject="Calculadora"
            ctx={ctx}
            kind={calc.slug === "isr" || calc.slug === "isv" ? "fiscal" : "laboral"}
          />
        </div>
      )}

      <section className="mt-8" aria-label="Calculadora">
        <CalculatorWidget slug={calc.slug} />
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {template && (
          <div className="rounded-2xl border-2 border-brand/40 bg-card p-6">
            <p className="font-heading text-lg font-bold">
              ¿Lo necesitas para varios empleados o cada mes?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Descarga la plantilla «{template.title}»: el mismo cálculo con fórmulas reales de
              Excel, para toda tu planilla, lista para imprimir.
            </p>
            <Button asChild className="mt-4">
              <Link href={canonicalTemplatePath(template)}>
                Abrir la plantilla <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        )}
        {guide && (
          <div className="rounded-2xl border bg-card p-6">
            <BookOpenIcon className="size-6 text-brand" aria-hidden />
            <p className="mt-2 font-heading text-lg font-bold">Entiende el cálculo</p>
            <p className="mt-1 text-sm text-muted-foreground">{guide.excerpt}</p>
            <Link
              href={`/blog/${guide.slug}`}
              className="mt-3 inline-block text-sm font-semibold text-brand-strong hover:underline"
            >
              Leer la guía paso a paso →
            </Link>
          </div>
        )}
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-heading text-2xl font-extrabold">Preguntas frecuentes</h2>
        <div className="mt-4">
          <Faq items={calc.faq} />
        </div>
      </section>

      {template && (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Plantilla recomendada</h2>
          <div className="mt-4 max-w-sm">
            <TemplateCard meta={template} />
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold">Otras calculadoras</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((c) => (
            <li key={c.slug}>
              <Link
                href={calculatorPath(c.slug, ctx.slug)}
                className="inline-block rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:border-brand hover:text-brand-strong"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
