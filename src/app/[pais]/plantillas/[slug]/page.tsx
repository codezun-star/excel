import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TemplatePage } from "@/components/template/template-page";
import { activeCountries, getCountryBySlug } from "@/countries";
import { templateMetadata } from "@/lib/seo";
import { CATALOG, getTemplateMeta } from "@/templates/catalog";
import { appliesToCountry } from "@/templates/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return activeCountries().flatMap((ctx) =>
    CATALOG.filter((t) => appliesToCountry(t, ctx.code)).map((t) => ({
      pais: ctx.slug,
      slug: t.slug,
    })),
  );
}

type Params = Promise<{ pais: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pais, slug } = await params;
  const meta = getTemplateMeta(slug);
  const ctx = getCountryBySlug(pais);
  return meta && ctx ? templateMetadata(meta, ctx) : {};
}

export default async function CountryTemplateRoute({ params }: { params: Params }) {
  const { pais, slug } = await params;
  const ctx = getCountryBySlug(pais);
  const meta = getTemplateMeta(slug);
  if (!ctx || !meta || !appliesToCountry(meta, ctx.code)) notFound();
  return <TemplatePage meta={meta} ctx={ctx} />;
}
