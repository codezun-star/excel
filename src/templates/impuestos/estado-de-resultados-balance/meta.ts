import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "estado-de-resultados-balance",
  title: "Estado de resultados y balance general",
  shortDescription:
    "Estados financieros básicos comparativos (año actual y anterior) con márgenes, verificación de cuadre e indicadores financieros.",
  category: "impuestos",
  tier: "pro",
  regulated: "fiscal",
  featured: true,
  seo: {
    title: "Estado de resultados y balance general en Excel con indicadores | Excel Codezun",
    description:
      "Plantilla de estados financieros en Excel: estado de resultados y balance general comparativos con márgenes, razón corriente, endeudamiento, ROA y ROE.",
    keywords: [
      "estado de resultados excel",
      "balance general excel",
      "estados financieros excel",
      "indicadores financieros",
    ],
  },
  details: {
    includes: [
      "Estado de resultados con utilidad bruta, operativa y neta y sus márgenes",
      "Balance general con activos, pasivos y patrimonio corrientes y no corrientes",
      "Comparación entre el año actual y el anterior con variación",
      "Verificación de que el activo es igual al pasivo más el patrimonio",
      "Indicadores: liquidez, prueba ácida, endeudamiento, ROA y ROE",
    ],
    audience: [
      "Contadores",
      "Empresas que solicitan crédito",
      "Emprendedores que presentan resultados a socios",
    ],
  },
});
