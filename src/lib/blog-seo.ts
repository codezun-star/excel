import type { Metadata } from "next";

import { getBlogCategory, readingMinutes, type Article, type Block } from "@/content/blog";
import type { CountryContext } from "@/countries";
import { absoluteUrl, SITE } from "@/lib/site";

export const BLOG_AUTHOR = "Equipo de Excel Codezun";

/** Texto plano (sin **, [](), ``) para JSON-LD y feeds. */
export function plainText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export function articleUrl(article: Pick<Article, "slug">): string {
  return absoluteUrl(`/blog/${article.slug}`);
}

export function articleMetadata(article: Article): Metadata {
  const path = `/blog/${article.slug}`;
  return {
    title: `${article.seoTitle} | ${SITE.name}`,
    description: article.description,
    keywords: article.keywords,
    authors: [{ name: BLOG_AUTHOR }],
    alternates: {
      canonical: path,
      languages: { "es-HN": path, "x-default": path },
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    openGraph: {
      type: "article",
      url: path,
      title: article.seoTitle,
      description: article.description,
      siteName: SITE.name,
      locale: SITE.ogLocale,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      section: getBlogCategory(article.category)?.name,
      tags: article.keywords,
      images: [{ url: `${path}/opengraph-image`, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle,
      description: article.description,
    },
    other: { "geo.region": "HN", "geo.placename": "Honduras" },
  };
}

export function articleJsonLd(article: Article, ctx: CountryContext, blocks: Block[]) {
  const url = articleUrl(article);
  const category = getBlogCategory(article.category);
  const steps = blocks.find((b): b is Extract<Block, { type: "steps" }> => b.type === "steps");
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: article.description,
      url,
      mainEntityOfPage: url,
      image: `${url}/opengraph-image`,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      inLanguage: "es-HN",
      keywords: article.keywords.join(", "),
      articleSection: category?.name,
      wordCount: readingMinutes(blocks) * 200,
      author: { "@type": "Organization", name: BLOG_AUTHOR, url: absoluteUrl("/") },
      publisher: {
        "@type": "Organization",
        name: SITE.name,
        url: absoluteUrl("/"),
        logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
      },
      about: { "@type": "Country", name: ctx.name },
      spatialCoverage: { "@type": "Country", name: ctx.name },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
        {
          "@type": "ListItem",
          position: 3,
          name: category?.name ?? "Guías",
          item: absoluteUrl(`/blog/categoria/${article.category}`),
        },
        { "@type": "ListItem", position: 4, name: article.title, item: url },
      ],
    },
  ];
  if (article.faq.length)
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: plainText(f.a) },
      })),
    });
  if (steps)
    data.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: article.title,
      description: article.description,
      inLanguage: "es-HN",
      step: steps.items.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: plainText(s.text),
      })),
    });
  return data;
}
