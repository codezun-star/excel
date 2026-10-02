import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "farmacia",
  title: "Control de farmacia",
  shortDescription:
    "Medicamentos por lote con vencimientos y alertas, ventas diarias con precio de lista, existencias y ventas del mes por día.",
  category: "negocios",
  businessTypes: ["farmacia"],
  tier: "pro",
  seo: {
    title: "Control de farmacia en Excel: lotes, vencimientos y ventas | Excel Codezun",
    description:
      "Plantilla para farmacias: catálogo de medicamentos, lotes con fecha de vencimiento, alertas, ventas diarias por lote y existencias.",
    keywords: [
      "control de farmacia excel",
      "control de medicamentos vencidos",
      "inventario de farmacia",
      "ventas diarias farmacia",
    ],
  },
  details: {
    includes: [
      "Catálogo de medicamentos con presentación, precio y si requiere receta",
      "Lotes con vencimiento, existencia y alerta de vencidos o por vencer",
      "Ventas por lote con precio de lista y forma de pago",
      "Ventas por día del mes y valor del inventario",
    ],
    audience: ["Farmacias y droguerías de barrio", "Botiquines y ventas de medicamentos"],
  },
});
