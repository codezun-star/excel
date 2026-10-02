import { CheckIcon, ChevronRightIcon, ClockIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ArticleCard } from "@/components/blog/article-card";
import { TemplateBadges } from "@/components/catalog/tier-badge";
import { TemplateCard } from "@/components/catalog/template-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { articlesForTemplate } from "@/content/blog";
import { calculatorPath, calculatorsFor } from "@/content/calculators";
import type { CountryContext } from "@/countries";
import { templateJsonLd } from "@/lib/seo";
import { getCategory } from "@/templates/categories";
import { relatedTemplates } from "@/templates/catalog";
import type { TemplateMeta } from "@/templates/types";

import { LegalNotice } from "./legal-notice";
import { TemplateWorkspace } from "./template-workspace";

export function TemplatePage({ meta, ctx }: { meta: TemplateMeta; ctx: CountryContext }) {
  const category = getCategory(meta.category);
  const related = relatedTemplates(meta, 4);
  const guides = articlesForTemplate(meta.slug);
  const calculators = ctx.code === "HN" ? calculatorsFor({ template: meta.slug }) : [];
  return (
    <div className="container-page py-8">
      <JsonLd data={templateJsonLd(meta, ctx)} />
      <nav
        aria-label="Ruta de navegación"
        className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRightIcon className="size-3.5" aria-hidden />
        <Link href="/plantillas" className="hover:text-foreground">
          Plantillas
        </Link>
        <ChevronRightIcon className="size-3.5" aria-hidden />
        <Link href={`/plantillas?categoria=${category.id}`} className="hover:text-foreground">
          {category.name}
        </Link>
        <ChevronRightIcon className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">
          {meta.title}
        </span>
      </nav>

      <header className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <TemplateBadges meta={meta} />
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{meta.title}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {meta.shortDescription}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {Array.isArray(meta.countries)
              ? `Reglas de ${ctx.name}`
              : `Montos en ${ctx.currency.code} (${ctx.name})`}{" "}
            · Archivo .xlsx compatible con Excel, Google Sheets y LibreOffice
          </p>
        </div>
        {meta.regulated && <LegalNotice ctx={ctx} kind={meta.regulated} />}
      </header>

      <section className="mt-8" aria-label="Configurar y descargar">
        {meta.status === "ready" ? (
          <Suspense fallback={<Skeleton className="h-[520px]" />}>
            <TemplateWorkspace
              slug={meta.slug}
              title={meta.title}
              tier={meta.tier}
              country={ctx.code}
            />
          </Suspense>
        ) : (
          <div className="bg-sheet-grid rounded-xl border bg-card p-8 text-center sm:p-12">
            <ClockIcon className="mx-auto size-10 text-brand" aria-hidden />
            <h2 className="mt-4 text-2xl font-extrabold">Esta plantilla viene en camino</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Estamos preparando {meta.title.toLowerCase()} con fórmulas, validaciones y reglas de{" "}
              {ctx.name}. Mientras tanto, revisa otras plantillas de {category.name.toLowerCase()}.
            </p>
            <Button asChild className="mt-6">
              <Link href={`/plantillas?categoria=${category.id}`}>Ver plantillas disponibles</Link>
            </Button>
          </div>
        )}
      </section>

      {meta.details && (
        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-bold">Qué incluye</h2>
            <ul className="mt-4 space-y-2.5">
              {meta.details.includes.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-bold">Para quién es</h2>
            <ul className="mt-4 space-y-2.5">
              {meta.details.audience.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed">
                  <UsersIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {guides.length > 0 && (
        <section className="mt-12" aria-labelledby="guias">
          <h2 id="guias" className="text-2xl font-extrabold">
            Guías paso a paso
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Entiende el cálculo antes de usar la plantilla, con ejemplos en lempiras.
            {calculators.length > 0 && " ¿Un solo caso? Prueba la "}
            {calculators.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && " o la "}
                <Link
                  href={calculatorPath(c.slug)}
                  className="font-medium text-brand-strong underline"
                >
                  {c.title.toLowerCase()}
                </Link>
              </span>
            ))}
            {calculators.length > 0 && "."}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold">Plantillas relacionadas</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <TemplateCard key={t.slug} meta={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
