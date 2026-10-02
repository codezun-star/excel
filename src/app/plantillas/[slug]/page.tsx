import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TemplatePage } from "@/components/template/template-page";
import { DEFAULT_COUNTRY, requireCountryContext } from "@/countries";
import { templateMetadata } from "@/lib/seo";
import { CATALOG, getTemplateMeta } from "@/templates/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return CATALOG.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getTemplateMeta(slug);
  return meta ? templateMetadata(meta) : {};
}

export default async function TemplateRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getTemplateMeta(slug);
  if (!meta) notFound();
  const country = Array.isArray(meta.countries) ? meta.countries[0]! : DEFAULT_COUNTRY;
  return <TemplatePage meta={meta} ctx={requireCountryContext(country)} />;
}
