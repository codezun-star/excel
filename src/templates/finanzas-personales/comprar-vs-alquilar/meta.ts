import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "comprar-vs-alquilar",
  title: "Comprar o alquilar vivienda",
  shortDescription:
    "Compara año por año el costo y el patrimonio de comprar casa con préstamo contra alquilar e invertir la diferencia.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  seo: {
    title: "¿Comprar o alquilar casa? Calculadora en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para comparar comprar casa con préstamo contra alquilar: cuota, seguros, plusvalía, alquiler, inversión y patrimonio año por año.",
    keywords: [
      "comprar o alquilar casa",
      "conviene comprar o alquilar",
      "calculadora compra de vivienda",
      "alquilar vs comprar excel",
    ],
  },
  details: {
    includes: [
      "Cuota del préstamo con prima, tasa y plazo",
      "Seguros, mantenimiento, impuestos municipales y plusvalía",
      "Alquiler con aumento anual e inversión de la prima y de la diferencia",
      "Patrimonio en cada opción año por año y cuál conviene",
    ],
    audience: [
      "Familias que piensan comprar casa",
      "Quien recibe remesas y quiere invertir en vivienda",
    ],
  },
});
