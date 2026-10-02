import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";
import { canonicalTemplatePath } from "@/lib/seo";
import { ARTICLES, BLOG_CATEGORIES } from "@/content/blog";
import { CATALOG } from "@/templates/catalog";

/** Sitemap dinámico desde el registro de plantillas (solo URL canónicas de plantillas listas). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: absoluteUrl("/plantillas"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: absoluteUrl("/precios"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    {
      url: absoluteUrl("/aviso-legal"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: absoluteUrl("/terminos"), lastModified: now, changeFrequency: "yearly", priority: 0.1 },
    {
      url: absoluteUrl("/privacidad"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.1,
    },
    {
      url: absoluteUrl("/reembolsos"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.1,
    },
  ];
  const templates: MetadataRoute.Sitemap = CATALOG.filter((t) => t.status === "ready").map((t) => ({
    url: absoluteUrl(canonicalTemplatePath(t)),
    lastModified: now,
    changeFrequency: "monthly",
    priority: t.featured ? 0.9 : 0.8,
  }));
  const latest = ARTICLES.reduce((m, a) => (a.updatedAt > m ? a.updatedAt : m), "2026-01-01");
  const blog: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/blog"),
      lastModified: new Date(latest),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...BLOG_CATEGORIES.map((c) => ({
      url: absoluteUrl(`/blog/categoria/${c.id}`),
      lastModified: new Date(latest),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...ARTICLES.map((a) => ({
      url: absoluteUrl(`/blog/${a.slug}`),
      lastModified: new Date(a.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
  return [...pages, ...templates, ...blog];
}
