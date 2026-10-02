import { describe, expect, it } from "vitest";

import { requireCountryContext } from "@/countries";
import { canonicalTemplatePath } from "@/lib/seo";
import { CATALOG, getTemplateMeta } from "@/templates/catalog";

import { allBlockText, ARTICLES, BLOG_CATEGORIES, internalLinks, readingMinutes } from ".";

const ctx = requireCountryContext("HN");

const VALID_PATHS = new Set<string>([
  "/",
  "/plantillas",
  "/precios",
  "/blog",
  "/aviso-legal",
  ...ARTICLES.map((a) => `/blog/${a.slug}`),
  ...BLOG_CATEGORIES.map((c) => `/blog/categoria/${c.id}`),
  ...CATALOG.filter((t) => t.status === "ready").map((t) => canonicalTemplatePath(t)),
]);

describe("blog", () => {
  it("tiene slugs únicos y en formato URL", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(ARTICLES.map((a) => [a.slug, a] as const))("%s: metadatos SEO completos", (_, a) => {
    expect(a.seoTitle.length).toBeLessThanOrEqual(65);
    expect(a.description.length).toBeGreaterThanOrEqual(110);
    expect(a.description.length).toBeLessThanOrEqual(170);
    expect(a.keywords.length).toBeGreaterThanOrEqual(4);
    expect(a.faq.length).toBeGreaterThanOrEqual(2);
    expect(BLOG_CATEGORIES.some((c) => c.id === a.category)).toBe(true);
    expect(a.updatedAt >= a.publishedAt).toBe(true);
  });

  it.each(ARTICLES.map((a) => [a.slug, a] as const))(
    "%s: plantillas existentes, CTA y enlaces internos válidos",
    (_, a) => {
      for (const slug of a.templates) {
        const meta = getTemplateMeta(slug);
        expect(meta, slug).toBeDefined();
        expect(meta!.status, slug).toBe("ready");
      }
      const blocks = a.body(ctx);
      const ctas = blocks.filter((b) => b.type === "cta");
      expect(ctas.length).toBeGreaterThanOrEqual(1);
      for (const cta of ctas) {
        if (cta.type === "cta") expect(getTemplateMeta(cta.template)?.status).toBe("ready");
      }
      const h2 = blocks.filter((b) => b.type === "h2");
      expect(h2.length).toBeGreaterThanOrEqual(2);
      const ids = h2.map((b) => (b.type === "h2" ? b.id : ""));
      expect(new Set(ids).size).toBe(ids.length);
      const links = [
        ...allBlockText(blocks).flatMap(internalLinks),
        ...a.faq.flatMap((f) => internalLinks(f.a)),
      ];
      for (const href of links) expect(VALID_PATHS, `${a.slug} → ${href}`).toContain(href);
      expect(readingMinutes(blocks)).toBeGreaterThanOrEqual(2);
    },
  );

  it("los ejemplos no contienen valores inválidos (NaN, undefined, Infinity)", () => {
    for (const a of ARTICLES) {
      const text = allBlockText(a.body(ctx)).join(" ");
      expect(text, a.slug).not.toMatch(/NaN|undefined|Infinity|\[object/);
    }
  });

  it("cada artículo enlaza al menos a otra guía o plantilla dentro del texto", () => {
    for (const a of ARTICLES) {
      const links = allBlockText(a.body(ctx)).flatMap(internalLinks);
      expect(links.length, a.slug).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("calculadoras", () => {
  it("cada calculadora apunta a una plantilla lista y a una guía existente", async () => {
    const { CALCULATORS } = await import("@/content/calculators");
    const { getArticle } = await import(".");
    const slugs = CALCULATORS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of CALCULATORS) {
      expect(getTemplateMeta(c.template)?.status, c.slug).toBe("ready");
      expect(getArticle(c.guide), c.slug).toBeDefined();
      expect(c.seoTitle.length, c.slug).toBeLessThanOrEqual(65);
      expect(c.description.length, c.slug).toBeGreaterThanOrEqual(110);
      expect(c.description.length, c.slug).toBeLessThanOrEqual(170);
    }
  });
});
