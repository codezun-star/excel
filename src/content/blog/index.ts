import { aguinaldo } from "./articles/aguinaldo";
import { decimoCuartoMes } from "./articles/decimo-cuarto-mes";
import { factura } from "./articles/factura";
import { horasExtra } from "./articles/horas-extra";
import { inventario } from "./articles/inventario";
import { isr } from "./articles/isr";
import { isvMensual } from "./articles/isv";
import { planilla } from "./articles/planilla";
import { prestaciones } from "./articles/prestaciones";
import { prestamo } from "./articles/prestamo";
import { presupuestoRemesas } from "./articles/presupuesto-remesas";
import { salarioMinimo } from "./articles/salario-minimo";
import type { Article, Block, BlogCategory, BlogCategoryId } from "./types";

export type { Article, Block, BlogCategory, BlogCategoryId } from "./types";

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: "planilla",
    name: "Planilla y derechos laborales",
    description:
      "Décimo tercer y cuarto mes, prestaciones, horas extra, IHSS, RAP y salario mínimo en Honduras.",
  },
  {
    id: "impuestos",
    name: "Impuestos",
    description: "ISV, ISR y obligaciones con el SAR explicadas con ejemplos en lempiras.",
  },
  {
    id: "facturacion",
    name: "Facturación",
    description: "Facturas, cotizaciones y recibos que cumplen con el SAR.",
  },
  {
    id: "negocios",
    name: "Negocios e inventario",
    description: "Inventario, fiados, caja y precios para pulperías, tiendas y emprendedores.",
  },
  {
    id: "finanzas",
    name: "Finanzas personales",
    description: "Préstamos, presupuesto familiar y remesas.",
  },
];

/** Artículos publicados (el primero es el destacado del blog). */
export const ARTICLES: Article[] = [
  decimoCuartoMes,
  prestaciones,
  aguinaldo,
  planilla,
  factura,
  isvMensual,
  isr,
  horasExtra,
  salarioMinimo,
  inventario,
  prestamo,
  presupuestoRemesas,
].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getBlogCategory(id: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((c) => c.id === id);
}

export function articlesByCategory(id: BlogCategoryId): Article[] {
  return ARTICLES.filter((a) => a.category === id);
}

/** Guías que enlazan a una plantilla (para mostrarlas en su página). */
export function articlesForTemplate(slug: string, limit = 3): Article[] {
  return ARTICLES.filter((a) => a.templates.includes(slug))
    .sort((a, b) => a.templates.indexOf(slug) - b.templates.indexOf(slug))
    .slice(0, limit);
}

/** Artículos relacionados: misma categoría y plantillas en común. */
export function relatedArticles(article: Article, limit = 3): Article[] {
  return ARTICLES.filter((a) => a.slug !== article.slug)
    .map((a) => ({
      a,
      score:
        (a.category === article.category ? 2 : 0) +
        a.templates.filter((t) => article.templates.includes(t)).length,
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}

function blockText(block: Block): string {
  switch (block.type) {
    case "p":
    case "h2":
    case "h3":
      return block.text;
    case "ul":
    case "ol":
      return block.items.join(" ");
    case "table":
      return [...block.head, ...block.rows.flat()].join(" ");
    case "callout":
    case "cta":
      return block.text;
    case "formula":
      return `${block.formula} ${block.caption ?? ""}`;
    case "steps":
      return block.items.map((i) => `${i.title} ${i.text}`).join(" ");
    case "example":
      return block.rows.flat().join(" ");
  }
}

/** Minutos de lectura (≈ 200 palabras por minuto). */
export function readingMinutes(blocks: Block[]): number {
  const words = blocks.map(blockText).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

/** Enlaces internos de un texto con formato [texto](/ruta). */
export function internalLinks(text: string): string[] {
  return [...text.matchAll(/\[[^\]]+\]\((\/[^)\s]*)\)/g)].map((m) => m[1]!);
}

export function allBlockText(blocks: Block[]): string[] {
  return blocks.map(blockText);
}
