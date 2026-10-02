import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "gastos-e-ingresos",
  title: "Gastos e ingresos",
  shortDescription:
    "Registro diario de ingresos y gastos con resumen automático por mes, balance acumulado y gastos por categoría.",
  category: "finanzas-personales",
  businessTypes: ["hogar", "freelancer"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de gastos e ingresos en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para controlar gastos e ingresos en Excel: registro diario, resumen mensual, balance del año y gastos por categoría.",
    keywords: [
      "control de gastos excel",
      "gastos e ingresos excel",
      "registro de gastos personales",
    ],
  },
  details: {
    includes: [
      "Registro de ingresos y gastos con categoría y forma de pago",
      "Resumen mensual del año con balance",
      "Gastos e ingresos por categoría con porcentaje",
    ],
    audience: ["Personas y familias", "Freelancers"],
  },
});
