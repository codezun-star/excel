import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "contabilidad-de-iglesias",
  title: "Contabilidad de iglesias",
  shortDescription:
    "Diezmos, ofrendas, donaciones y gastos con saldo de caja, informe mensual, resumen anual por categoría y aportes por miembro.",
  category: "comunidad",
  businessTypes: ["iglesia-ong"],
  tier: "free",
  seo: {
    title: "Contabilidad de iglesia en Excel gratis: diezmos y ofrendas | Excel Codezun",
    description:
      "Plantilla gratis para la tesorería de la iglesia: diezmos, ofrendas, donaciones, gastos, saldo, informe mensual y resumen anual.",
    keywords: [
      "contabilidad de iglesia excel",
      "control de diezmos y ofrendas",
      "tesorería iglesia",
      "informe financiero iglesia",
    ],
  },
  details: {
    includes: [
      "Registro de ingresos y egresos por categoría con comprobante",
      "Saldo inicial y saldo de caja mes a mes",
      "Resumen anual por categoría de ingreso y de gasto",
      "Aportes por miembro o donante (diezmos y ofrendas)",
    ],
    audience: ["Tesoreros de iglesias y congregaciones", "ONG, fundaciones y grupos comunitarios"],
  },
});
