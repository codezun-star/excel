import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "cuotas-patronato",
  title: "Cuotas de patronato",
  shortDescription:
    "Control de cuotas mensuales por vivienda o familia con pagos por mes, morosos, gastos del patronato y saldo en caja.",
  category: "comunidad",
  businessTypes: ["iglesia-ong"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de cuotas de patronato en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para patronatos y juntas de agua en Excel: cuotas por vivienda, pagos por mes, morosos, gastos y saldo en caja para la asamblea.",
    keywords: [
      "control de cuotas patronato",
      "cuotas junta de agua excel",
      "control de pagos colonia",
      "patronato excel",
    ],
  },
  details: {
    includes: [
      "Cuota mensual por vivienda con pagos de enero a diciembre",
      "Saldo pendiente y estado (al día o moroso) al mes de corte",
      "Registro de gastos del patronato",
      "Resumen para la asamblea: recaudado, gastado y saldo en caja",
    ],
    audience: ["Patronatos y juntas de agua", "Comités de colonias y residenciales"],
  },
});
