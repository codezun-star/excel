import { CalendarIcon, ClockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/blog/article-body";
import { ArticleCard } from "@/components/blog/article-card";
import { TemplateCard } from "@/components/catalog/template-card";
import { Faq } from "@/components/landing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { LegalNotice } from "@/components/template/legal-notice";
import {
  ARTICLES,
  getArticle,
  getBlogCategory,
  readingMinutes,
  relatedArticles,
} from "@/content/blog";
import { fmtDate } from "@/content/blog/calc";
import { requireCountryContext } from "@/countries";
import { articleJsonLd, articleMetadata, BLOG_AUTHOR } from "@/lib/blog-seo";
import { getTemplateMeta } from "@/templates/catalog";
import type { TemplateMeta } from "@/templates/types";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const article = getArticle((await params).slug);
  return article ? articleMetadata(article) : {};
}

export default async function ArticlePage({ params }: { params: Params }) {
  const article = getArticle((await params).slug);
  if (!article) notFound();
  const ctx = requireCountryContext("HN");
  const blocks = article.body(ctx);
  const category = getBlogCategory(article.category);
  const toc = blocks.filter((b) => b.type === "h2");
  const templates = article.templates
    .map((s) => getTemplateMeta(s))
    .filter((m): m is TemplateMeta => Boolean(m && m.status === "ready"));
  const related = relatedArticles(article);

  return (
    <div className="container-page py-10">
      <JsonLd data={articleJsonLd(article, ctx, blocks)} />
      <nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/blog" className="hover:underline">
              Blog
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/blog/categoria/${article.category}`} className="hover:underline">
              {category?.name}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="max-w-3xl min-w-0">
          <header>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{article.title}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{BLOG_AUTHOR}</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-4" aria-hidden />
                Actualizado el{" "}
                <time dateTime={article.updatedAt}>{fmtDate(article.updatedAt)}</time>
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="size-4" aria-hidden />
                {readingMinutes(blocks)} min de lectura
              </span>
            </p>
          </header>

          {article.regulated && (
            <div className="mt-6">
              <LegalNotice
                ctx={ctx}
                kind={article.category === "planilla" ? "laboral" : "fiscal"}
              />
            </div>
          )}

          <div className="mt-8">
            <ArticleBody blocks={blocks} />
          </div>

          {article.faq.length > 0 && (
            <section className="mt-12" aria-labelledby="preguntas">
              <h2 id="preguntas" className="font-heading text-2xl font-extrabold">
                Preguntas frecuentes
              </h2>
              <div className="mt-4">
                <Faq items={article.faq} />
              </div>
            </section>
          )}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-6">
            {toc.length > 0 && (
              <nav aria-label="En esta guía" className="rounded-xl border bg-card p-4 text-sm">
                <p className="font-semibold">En esta guía</p>
                <ol className="mt-2 space-y-1.5">
                  {toc.map((h) =>
                    h.type === "h2" ? (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {h.text}
                        </a>
                      </li>
                    ) : null,
                  )}
                </ol>
              </nav>
            )}
            {templates[0] && (
              <div>
                <p className="mb-2 text-sm font-semibold">Plantilla recomendada</p>
                <TemplateCard meta={templates[0]} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {templates.length > 0 && (
        <section className="mt-16" aria-labelledby="plantillas-relacionadas">
          <h2 id="plantillas-relacionadas" className="text-2xl font-extrabold">
            Plantillas para hacerlo en minutos
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t) => (
              <TemplateCard key={t.slug} meta={t} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="guias-relacionadas">
          <h2 id="guias-relacionadas" className="text-2xl font-extrabold">
            Sigue leyendo
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
