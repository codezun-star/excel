import type { CountryContext } from "@/countries";

/**
 * Texto con formato mínimo: **negrita**, [enlace](/ruta) y `código`.
 * Se interpreta en components/blog/inline.tsx.
 */
export type Inline = string;

export type Block =
  | { type: "p"; text: Inline }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: Inline[] }
  | { type: "ol"; items: Inline[] }
  | { type: "table"; head: string[]; rows: Inline[][]; caption?: string }
  | { type: "callout"; tone: "info" | "warning" | "tip"; title?: string; text: Inline }
  /** Tarjeta que lleva a una plantilla (la conversión principal del artículo) */
  | { type: "cta"; template: string; title: string; text: Inline }
  /** Fórmula de Excel copiable */
  | { type: "formula"; formula: string; caption?: Inline }
  /** Pasos numerados (también se publican como HowTo en JSON-LD) */
  | { type: "steps"; items: { title: string; text: Inline }[] }
  /** Ejemplo numérico tipo recibo */
  | { type: "example"; title: string; rows: [string, string][]; total?: [string, string] };

export type BlogCategoryId = "planilla" | "impuestos" | "facturacion" | "negocios" | "finanzas";

export interface BlogCategory {
  id: BlogCategoryId;
  name: string;
  description: string;
}

export interface Article {
  slug: string;
  /** Título visible (H1) */
  title: string;
  /** Título para buscadores (≤ 65 caracteres idealmente) */
  seoTitle: string;
  /** Meta descripción (120–160 caracteres) */
  description: string;
  /** Resumen para las tarjetas del blog */
  excerpt: string;
  keywords: string[];
  category: BlogCategoryId;
  publishedAt: string;
  updatedAt: string;
  /** Plantillas relacionadas (slugs); la primera es la principal */
  templates: string[];
  /** Usa tasas o reglas legales: muestra el aviso de verificación */
  regulated?: boolean;
  faq: { q: string; a: string }[];
  /** El cuerpo recibe el contexto del país para usar SIEMPRE las tasas del módulo de reglas */
  body: (ctx: CountryContext) => Block[];
}
