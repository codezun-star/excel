import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "punto-de-equilibrio",
  title: "Punto de equilibrio",
  shortDescription:
    "Calcula cuántas unidades y cuánto en ventas necesitas para cubrir tus costos, con meta de utilidad y tabla de escenarios.",
  category: "impuestos",
  businessTypes: [...ALL_SHOPS, "servicios"],
  tier: "free",
  seo: {
    title: "Punto de equilibrio en Excel gratis (unidades y ventas) | Excel Codezun",
    description:
      "Calcula el punto de equilibrio de tu negocio en Excel: margen de contribución, unidades y ventas necesarias, meta de utilidad y escenarios.",
    keywords: [
      "punto de equilibrio excel",
      "calcular punto de equilibrio",
      "margen de contribucion",
    ],
  },
  details: {
    includes: [
      "Costos fijos detallados y costo variable por unidad",
      "Margen de contribución y punto de equilibrio en unidades y en dinero",
      "Unidades necesarias para alcanzar una utilidad deseada",
      "Tabla de escenarios con utilidad o pérdida por volumen de ventas",
    ],
    audience: ["Emprendedores", "Negocios que evalúan precios o un producto nuevo"],
  },
});
