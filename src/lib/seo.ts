import type { Metadata } from "next";

import { countrySlug, type CountryContext } from "@/countries";
import { absoluteUrl, SITE } from "@/lib/site";
import { getCategory } from "@/templates/categories";
import type { TemplateMeta } from "@/templates/types";

/**
 * URL canónica de una plantilla: las plantillas de un solo país (fiscales o
 * laborales) usan la ruta por país; las generales, /plantillas/[slug].
 */
export function canonicalTemplatePath(meta: Pick<TemplateMeta, "slug" | "countries">): string {
  if (Array.isArray(meta.countries) && meta.countries.length === 1) {
    return `/${countrySlug(meta.countries[0]!)}/plantillas/${meta.slug}`;
  }
  return `/plantillas/${meta.slug}`;
}

export function templateMetadata(meta: TemplateMeta, ctx?: CountryContext): Metadata {
  const canonical = canonicalTemplatePath(meta);
  const title =
    ctx && !meta.seo.title.includes(ctx.name)
      ? meta.seo.title.replace(" | ", ` (${ctx.name}) | `)
      : meta.seo.title;
  return {
    title,
    description: meta.seo.description,
    keywords: meta.seo.keywords,
    alternates: { canonical },
    robots: meta.status === "coming-soon" ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description: meta.seo.description,
      siteName: SITE.name,
      locale: SITE.ogLocale,
      images: [
        {
          url: `/plantillas/${meta.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description: meta.seo.description },
  };
}

export function templateJsonLd(meta: TemplateMeta, ctx: CountryContext) {
  const url = absoluteUrl(canonicalTemplatePath(meta));
  const category = getCategory(meta.category);
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Plantillas", item: absoluteUrl("/plantillas") },
        {
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: absoluteUrl(`/plantillas?categoria=${category.id}`),
        },
        { "@type": "ListItem", position: 4, name: meta.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: meta.title,
      description: meta.shortDescription,
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Microsoft Excel, Google Sheets, LibreOffice",
      inLanguage: "es",
      areaServed: Array.isArray(meta.countries)
        ? meta.countries.map((c) => ({ "@type": "Country", name: c === ctx.code ? ctx.name : c }))
        : undefined,
      offers:
        meta.tier === "free"
          ? { "@type": "Offer", price: "0", priceCurrency: ctx.currency.code }
          : undefined,
      publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    },
  ];
}
