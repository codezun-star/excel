import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/blog/article-card";
import { JsonLd } from "@/components/seo/json-ld";
import { BLOG_CATEGORIES, articlesByCategory, getBlogCategory } from "@/content/blog";
import { articleUrl } from "@/lib/blog-seo";
import { absoluteUrl, SITE } from "@/lib/site";

type Params = Promise<{ categoria: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ categoria: c.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const category = getBlogCategory((await params).categoria);
  if (!category) return {};
  const path = `/blog/categoria/${category.id}`;
  return {
    title: `${category.name} en Honduras: guías y plantillas | ${SITE.name}`,
    description: category.description,
    alternates: { canonical: path, languages: { "es-HN": path, "x-default": path } },
    openGraph: {
      type: "website",
      url: path,
      title: category.name,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const category = getBlogCategory((await params).categoria);
  if (!category) notFound();
  const items = articlesByCategory(category.id);
  return (
    <div className="container-page py-12">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: category.name,
            description: category.description,
            url: absoluteUrl(`/blog/categoria/${category.id}`),
            inLanguage: "es-HN",
            hasPart: items.map((a) => ({
              "@type": "BlogPosting",
              headline: a.title,
              url: articleUrl(a),
            })),
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
                name: category.name,
                item: absoluteUrl(`/blog/categoria/${category.id}`),
              },
            ],
          },
        ]}
      />
      <nav className="text-sm text-muted-foreground">
        <Link href="/blog" className="hover:underline">
          ← Todas las guías
        </Link>
      </nav>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{category.description}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
