import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "constructora-presupuesto-de-obra",
  title: "Presupuesto de obra",
  shortDescription:
    "Presupuesto por capítulos y renglones con materiales, mano de obra y equipo, indirectos, imprevistos, utilidad, ISV y avance ejecutado.",
  category: "negocios",
  businessTypes: ["constructora"],
  tier: "pro",
  seo: {
    title: "Presupuesto de obra en Excel por renglones | Excel Codezun",
    description:
      "Plantilla de presupuesto de construcción: renglones con materiales, mano de obra y equipo, indirectos, utilidad, ISV, resumen por capítulo y avance.",
    keywords: [
      "presupuesto de obra excel",
      "presupuesto de construcción",
      "renglones de obra",
      "presupuesto por partidas",
    ],
  },
  details: {
    includes: [
      "Renglones por capítulo con unidad, cantidad y costos unitarios",
      "Materiales, mano de obra y equipo por separado",
      "Administración, imprevistos, utilidad e ISV configurables",
      "Resumen por capítulo y avance ejecutado en porcentaje y monto",
    ],
    audience: ["Constructoras y maestros de obra", "Ingenieros y arquitectos independientes"],
  },
});
