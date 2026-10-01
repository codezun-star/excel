import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "horas-extra",
  title: "Horas extra",
  shortDescription:
    "Registro de horas extra con el valor de la hora ordinaria según la jornada y los recargos de ley, con resumen por empleado.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "pro",
  regulated: "laboral",
  seo: {
    title: "Cálculo de horas extra en Excel (Honduras): diurnas y nocturnas | Excel Codezun",
    description:
      "Calcula el pago de horas extra en Honduras en Excel con recargos del 25 %, 50 % y 75 % según el Código de Trabajo y resumen por empleado.",
    keywords: [
      "calculo horas extra honduras",
      "horas extras excel",
      "recargo horas extra nocturnas",
    ],
  },
  details: {
    includes: [
      "Valor de la hora ordinaria según salario y jornada (diurna, nocturna o mixta)",
      "Recargos por tipo de hora extra tomados de la ley",
      "Total por registro y resumen por empleado del mes",
    ],
    audience: ["Empresas con turnos y horas adicionales", "Encargados de planilla"],
  },
});
