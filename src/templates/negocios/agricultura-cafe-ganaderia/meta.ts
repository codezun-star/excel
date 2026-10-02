import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "agricultura-cafe-ganaderia",
  title: "Costos de producción agrícola (café, granos y ganado)",
  shortDescription:
    "Costos de producción por actividad y por manzana, cosecha, ventas, rendimiento y rentabilidad de la temporada para café, granos o ganado.",
  category: "negocios",
  businessTypes: ["agro"],
  tier: "free",
  seo: {
    title: "Costos de producción de café por manzana en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para productores: costos por actividad y por manzana, cosecha, ventas, rendimiento y ganancia de café, maíz, frijol o ganado.",
    keywords: [
      "costos de producción café por manzana",
      "control de finca excel",
      "rentabilidad agrícola",
      "costos de producción maíz frijol",
    ],
  },
  details: {
    includes: [
      "Costos por actividad: preparación, fertilización, mano de obra, corte y más",
      "Cosecha y ventas con cantidad, unidad (quintal, lata, litro) y precio",
      "Costo por manzana, rendimiento por manzana y costo por unidad producida",
      "Ganancia de la temporada y resumen por actividad",
    ],
    audience: ["Productores de café, maíz y frijol", "Ganaderos y pequeños productores"],
  },
});
