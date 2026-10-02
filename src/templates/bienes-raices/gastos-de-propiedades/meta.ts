import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "gastos-de-propiedades",
  title: "Gastos de propiedades",
  shortDescription:
    "Ingresos y gastos de varias casas, apartamentos o locales: impuesto de bienes inmuebles, mantenimiento y servicios, con resultado neto por propiedad y por mes.",
  category: "bienes-raices",
  businessTypes: ["inmobiliaria", "hogar"],
  tier: "free",
  seo: {
    title: "Control de gastos de propiedades en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para dueños de casas y locales en alquiler: ingresos, gastos por categoría, bienes inmuebles y ganancia neta por propiedad.",
    keywords: [
      "gastos de propiedades excel",
      "control de casas en alquiler",
      "gastos de mantenimiento de casa",
      "impuesto bienes inmuebles control",
    ],
  },
  details: {
    includes: [
      "Lista de propiedades con tipo, dirección y valor estimado",
      "Registro de ingresos y gastos por propiedad y categoría",
      "Resultado neto y rendimiento anual de cada propiedad",
      "Resumen mensual y totales por categoría de gasto",
    ],
    audience: [
      "Dueños de una o varias propiedades en alquiler",
      "Familias que administran casas heredadas o de remesas",
    ],
  },
});
