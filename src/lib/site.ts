/** Configuración general del sitio. */
export const SITE = {
  name: "Excel Codezun",
  shortName: "Excel Codezun",
  domain: "excel.codezun.com",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://excel.codezun.com").replace(/\/$/, ""),
  description:
    "Plantillas de Excel configurables para negocios, contadores y familias de Latinoamérica: elige, configura y descarga un .xlsx con fórmulas reales.",
  tagline: "Plantillas de Excel listas para tu negocio, configuradas en minutos",
  locale: "es-HN",
  ogLocale: "es_HN",
  contactEmail: "hola@codezun.com",
} as const;

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
