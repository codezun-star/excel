import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "jubilacion",
  title: "Plan de jubilación",
  shortDescription:
    "Proyección año por año de tu ahorro para el retiro con aportes crecientes, rendimiento e inflación, y la renta mensual que te daría.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  seo: {
    title: "Calculadora de jubilación y ahorro para el retiro en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para planear tu retiro: aportes mensuales, rendimiento, inflación, saldo a la edad de jubilación y renta mensual estimada.",
    keywords: [
      "calculadora de jubilación",
      "ahorro para el retiro excel",
      "plan de retiro",
      "cuánto ahorrar para jubilarme",
    ],
  },
  details: {
    includes: [
      "Edad actual, edad de retiro, ahorro actual y aporte mensual",
      "Aumento anual del aporte, rendimiento e inflación",
      "Saldo año por año y al momento del retiro (en valor de hoy)",
      "Renta mensual que podrías retirar durante los años de retiro",
    ],
    audience: [
      "Trabajadores independientes sin pensión",
      "Asalariados que quieren complementar su pensión",
    ],
  },
});
