import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FileDownIcon,
  FunctionSquareIcon,
  LandmarkIcon,
  MousePointerClickIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import Link from "next/link";

import { CategoryIcon } from "@/components/catalog/category-icon";
import { TemplateCard } from "@/components/catalog/template-card";
import { Faq, FAQ_ITEMS } from "@/components/landing/faq";
import { SearchBox } from "@/components/landing/search-box";
import { SheetMock } from "@/components/landing/sheet-mock";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { HN } from "@/countries/hn";
import { SITE } from "@/lib/site";
import { CATEGORIES } from "@/templates/categories";
import { CATALOG, categoryCounts, featuredTemplates } from "@/templates/catalog";
import { ArticleCard } from "@/components/blog/article-card";
import { ARTICLES } from "@/content/blog";

export default function HomePage() {
  const counts = categoryCounts();
  const ready = CATALOG.filter((t) => t.status === "ready").length;
  const featured = featuredTemplates(8);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: SITE.url,
            inLanguage: "es-HN",
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE.url}/plantillas?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE.name,
            url: SITE.url,
            logo: `${SITE.url}/icon.svg`,
            email: SITE.contactEmail,
            areaServed: { "@type": "Country", name: "Honduras" },
            knowsAbout: [
              "Planilla de sueldos en Honduras",
              "Décimo tercer y décimo cuarto mes",
              "Prestaciones laborales",
              "ISV e ISR en Honduras",
              "Plantillas de Excel",
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="bg-sheet-grid relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background/30" />
        <div className="container-page relative grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
              <span className="cell-label h-4 rounded-sm px-1 text-[10px]">HN</span>
              ISV, IHSS, RAP e ISR con reglas de {HN.name}
            </p>
            <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl lg:text-6xl">
              Plantillas de Excel listas para tu negocio,{" "}
              <span className="text-brand">configuradas en minutos</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Elige una plantilla, responde unas preguntas y descarga un archivo .xlsx con fórmulas
              reales, formatos y validaciones. Funciona en Excel y Google Sheets.
            </p>
            <SearchBox className="mt-7 max-w-xl" />
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/hn/plantillas/factura-con-isv">
                  Crear factura gratis
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/plantillas">Ver las {CATALOG.length} plantillas</Link>
              </Button>
            </div>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 text-sm">
              <Stat value={String(ready)} label="plantillas listas" />
              <Stat value={String(CATEGORIES.length)} label="categorías" />
              <Stat value="100 %" label="fórmulas reales" />
            </dl>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -top-6 -right-6 size-28 rounded-2xl bg-highlight/30 blur-2xl" />
            <SheetMock />
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section id="categorias" className="container-page scroll-mt-20 py-16">
        <SectionTitle
          eyebrow="Categorías"
          title="Plantillas para cada necesidad"
          subtitle="Desde la pulpería hasta la contabilidad de tu empresa."
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/plantillas?categoria=${c.id}`}
              className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-brand/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
                <CategoryIcon name={c.icon} className="size-5" />
              </span>
              <span>
                <span className="block font-heading font-bold">{c.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {counts[c.id].ready} listas · {counts[c.id].total} en total
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacadas */}
      <section className="border-y bg-brand-soft/60 py-16">
        <div className="container-page">
          <SectionTitle
            eyebrow="Destacadas"
            title="Las más usadas en Honduras"
            subtitle="Configúralas con tus datos y descárgalas al instante."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((t) => (
              <TemplateCard key={t.slug} meta={t} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/plantillas">
                Explorar el catálogo
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="container-page scroll-mt-20 py-16">
        <SectionTitle eyebrow="Cómo funciona" title="Tu archivo listo en 3 pasos" />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: MousePointerClickIcon,
              title: "1. Elige",
              text: "Busca la plantilla que necesitas en el catálogo.",
            },
            {
              icon: SlidersHorizontalIcon,
              title: "2. Configura",
              text: "Escribe los datos de tu negocio, elige columnas, colores y opciones. Mira la vista previa.",
            },
            {
              icon: FileDownIcon,
              title: "3. Descarga",
              text: "Obtén un .xlsx con fórmulas, validaciones y una hoja de instrucciones.",
            },
          ].map((s) => (
            <li key={s.title} className="relative rounded-xl border bg-card p-6">
              <s.icon className="mb-4 size-8 text-brand" aria-hidden />
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Confianza */}
      <section className="border-y py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionTitle
            eyebrow="Por qué confiar"
            title="Hojas de cálculo bien hechas, no tablas con números pegados"
            subtitle="Cada archivo está pensado para que lo sigas usando todos los meses."
            align="left"
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: FunctionSquareIcon,
                title: "Fórmulas reales",
                text: "Los totales se recalculan solos al cambiar cualquier dato.",
              },
              {
                icon: ShieldCheckIcon,
                title: "Tus datos son tuyos",
                text: "Las plantillas gratis se generan en tu navegador, sin enviar tu información.",
              },
              {
                icon: LandmarkIcon,
                title: "Reglas con fuente",
                text: `Tasas y techos de ${HN.name} con fecha de revisión y fuentes oficiales.`,
              },
              {
                icon: CheckCircle2Icon,
                title: "Listas para usar",
                text: "Validaciones, listas desplegables, colores de alerta y hoja de instrucciones.",
              },
            ].map((f) => (
              <li key={f.title} className="flex gap-3 rounded-xl border bg-card p-5">
                <f.icon className="mt-0.5 size-6 shrink-0 text-brand" aria-hidden />
                <div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Guías */}
      <section className="container-page py-16" aria-labelledby="guias-home">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle eyebrow="Guías para Honduras" title="Aprende a calcularlo, paso a paso" />
          <Link href="/blog" className="text-sm font-semibold text-brand-strong hover:underline">
            Ver todas las guías
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.slice(0, 6).map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page max-w-3xl py-16">
        <SectionTitle eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
        <div className="mt-8">
          <Faq />
        </div>
      </section>

      {/* CTA */}
      <section className="container-page">
        <div className="bg-sheet-grid relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <h2 className="text-3xl font-extrabold">Empieza con una plantilla gratis</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">
            Sin registrarte. Configúrala, revísala en pantalla y descárgala en segundos.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="highlight">
              <Link href="/plantillas">Ver plantillas</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-heading text-2xl font-extrabold tabular-nums">{value}</dd>
      <dd className="text-xs text-muted-foreground">{label}</dd>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-sm font-semibold tracking-wide text-brand-strong uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
