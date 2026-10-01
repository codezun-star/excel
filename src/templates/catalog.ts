import type { CountryCode } from "@/countries";

import { CATEGORIES } from "./categories";
import { COMING_SOON } from "./coming-soon";
import { READY_METAS } from "./registry/ready-metas";
import {
  appliesToCountry,
  type BusinessTypeId,
  type CategoryId,
  type TemplateMeta,
  type TemplateTier,
} from "./types";

/**
 * Catálogo completo (solo metadatos, sin ExcelJS): fuente para páginas,
 * buscador, sitemap y SEO. Las plantillas listas aparecen primero.
 */
export const CATALOG: TemplateMeta[] = [...READY_METAS, ...COMING_SOON];

const BY_SLUG = new Map(CATALOG.map((t) => [t.slug, t]));

export function getTemplateMeta(slug: string): TemplateMeta | undefined {
  return BY_SLUG.get(slug);
}

export function readyTemplates(): TemplateMeta[] {
  return CATALOG.filter((t) => t.status === "ready");
}

export function featuredTemplates(limit = 8): TemplateMeta[] {
  const featured = CATALOG.filter((t) => t.status === "ready" && t.featured);
  const rest = CATALOG.filter((t) => t.status === "ready" && !t.featured);
  return [...featured, ...rest].slice(0, limit);
}

export interface CatalogFilter {
  query?: string;
  category?: CategoryId | null;
  businessType?: BusinessTypeId | null;
  tier?: TemplateTier | null;
  country?: CountryCode;
  onlyReady?: boolean;
}

/** Normaliza para buscar sin acentos ni mayúsculas. */
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function filterCatalog(
  filter: CatalogFilter,
  items: TemplateMeta[] = CATALOG,
): TemplateMeta[] {
  const terms = normalizeSearch(filter.query ?? "")
    .split(/\s+/)
    .filter(Boolean);
  return items.filter((t) => {
    if (filter.onlyReady && t.status !== "ready") return false;
    if (filter.category && t.category !== filter.category) return false;
    if (filter.businessType && !t.businessTypes?.includes(filter.businessType)) return false;
    if (filter.tier && t.tier !== filter.tier) return false;
    if (filter.country && !appliesToCountry(t, filter.country)) return false;
    if (terms.length) {
      const haystack = normalizeSearch(
        [t.title, t.shortDescription, t.slug, ...(t.seo.keywords ?? [])].join(" "),
      );
      return terms.every((term) => haystack.includes(term));
    }
    return true;
  });
}

export function templatesByCategory(category: CategoryId): TemplateMeta[] {
  return CATALOG.filter((t) => t.category === category);
}

export function categoryCounts(): Record<CategoryId, { total: number; ready: number }> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c.id, { total: 0, ready: 0 }])) as Record<
    CategoryId,
    { total: number; ready: number }
  >;
  for (const t of CATALOG) {
    out[t.category].total++;
    if (t.status === "ready") out[t.category].ready++;
  }
  return out;
}

export function relatedTemplates(meta: TemplateMeta, limit = 4): TemplateMeta[] {
  return CATALOG.filter((t) => t.slug !== meta.slug && t.category === meta.category)
    .sort((a, b) => Number(b.status === "ready") - Number(a.status === "ready"))
    .slice(0, limit);
}
