import { RssIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/blog/article-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ARTICLES, BLOG_CATEGORIES, articlesByCategory } from "@/content/blog";
import { articleUrl } from "@/lib/blog-seo";
import { absoluteUrl, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guías de planilla, impuestos y Excel para Honduras | Blog de Excel Codezun",
  description:
    "Guías prácticas para Honduras: cómo calcular el décimo cuarto mes, aguinaldo, prestaciones, planilla con IHSS y RAP, ISV, ISR, facturas del SAR e inventario en Excel.",
  keywords: [
    "blog Excel Honduras",
    "guías planilla Honduras",
    "impuestos Honduras",
    "cálculos laborales Honduras",
    "plantillas Excel Honduras",
  ],
  alternates: {
    canonical: "/blog",
    languages: { "es-HN": "/blog", "x-default": "/blog" },
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Guías de planilla, impuestos y Excel para Honduras",
    description:
      "Décimo cuarto, aguinaldo, prestaciones, ISV, ISR y más, explicados con ejemplos en lempiras y plantillas listas.",
    siteName: SITE.name,
    locale: SITE.ogLocale,
  },
  other: { "geo.region": "HN", "geo.placename": "Honduras" },
};

export default function BlogPage() {
  const featured = ARTICLES[0];
  return (
    <div className="container-page py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `Blog de ${SITE.name}`,
            url: absoluteUrl("/blog"),
            inLanguage: "es-HN",
            description:
              "Guías prácticas de planilla, impuestos, facturación y Excel para Honduras.",
            blogPost: ARTICLES.map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              url: articleUrl(a),
              datePublished: a.publishedAt,
              dateModified: a.updatedAt,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            ],
          },
        ]}
      />
      <header className="max-w-3xl">
        <p className="text-sm font-semibold tracking-wide text-brand-strong uppercase">
          Guías para Honduras
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Planilla, impuestos y Excel, explicados con ejemplos en lempiras
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Cómo calcular el décimo cuarto, el aguinaldo, las prestaciones, el ISV y el ISR paso a
          paso, con fórmulas que puedes copiar y plantillas listas para descargar.
        </p>
        <nav aria-label="Categorías del blog" className="mt-6 flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/blog/categoria/${c.id}`}
              className="rounded-full border bg-card px-3 py-1.5 text-sm font-medium hover:border-brand hover:text-brand-strong"
            >
              {c.name}
            </Link>
          ))}
          <Link
            href="/blog/rss.xml"
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <RssIcon className="size-4" aria-hidden /> RSS
          </Link>
        </nav>
      </header>

      {featured && (
        <section className="mt-10" aria-label="Guía destacada">
          <ArticleCard article={featured} featured />
        </section>
      )}

      {BLOG_CATEGORIES.map((c) => {
        const items = articlesByCategory(c.id).filter((a) => a.slug !== featured?.slug);
        if (!items.length) return null;
        return (
          <section key={c.id} className="mt-14" aria-labelledby={`cat-${c.id}`}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id={`cat-${c.id}`} className="text-2xl font-extrabold">
                  {c.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              </div>
              <Link
                href={`/blog/categoria/${c.id}`}
                className="text-sm font-medium text-brand-strong hover:underline"
              >
                Ver todo
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
