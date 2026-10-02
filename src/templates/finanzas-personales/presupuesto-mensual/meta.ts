import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "presupuesto-mensual",
  title: "Presupuesto mensual",
  shortDescription:
    "Presupuesto familiar por categorías con ingresos, gasto real registrado, diferencia, porcentaje usado y ahorro del mes.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  featured: true,
  seo: {
    title: "Presupuesto mensual familiar en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis de presupuesto mensual familiar en Excel: ingresos, gastos por categoría, gasto real contra presupuesto y ahorro del mes.",
    keywords: [
      "presupuesto mensual excel",
      "presupuesto familiar",
      "control de gastos del hogar",
      "presupuesto personal excel",
    ],
  },
  details: {
    includes: [
      "Ingresos del mes (salario, remesas, negocio)",
      "Presupuesto por categoría y gasto real desde el registro de gastos",
      "Diferencia y porcentaje usado con colores",
      "Ahorro del mes y tasa de ahorro",
    ],
    audience: ["Familias", "Personas que quieren ordenar sus finanzas"],
  },
});
