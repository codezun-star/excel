import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "aportes-asociaciones",
  title: "Aportes de asociaciones",
  shortDescription:
    "Socios con inscripción y cuota mensual, aportes extraordinarios, gastos por categoría, morosos y saldo de la asociación mes a mes.",
  category: "comunidad",
  businessTypes: ["iglesia-ong", "agro"],
  tier: "free",
  seo: {
    title: "Control de aportes de socios en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para asociaciones, gremios, clubes y comités: cuotas de socios, inscripción, aportes extraordinarios, gastos y morosos.",
    keywords: [
      "control de aportes de socios excel",
      "cuotas de asociación",
      "tesorería de club",
      "control de socios morosos",
    ],
  },
  details: {
    includes: [
      "Matriz de socios por mes con inscripción, total pagado y saldo pendiente",
      "Socios al día y morosos resaltados automáticamente",
      "Aportes extraordinarios por actividad y gastos por categoría",
      "Resumen mensual de ingresos, egresos y saldo para la asamblea",
    ],
    audience: [
      "Asociaciones de productores, gremios y colegios",
      "Clubes deportivos, comités y grupos de exalumnos",
    ],
  },
});
