import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "isr-personas-naturales",
  title: "ISR de personas naturales",
  shortDescription:
    "Cálculo anual del Impuesto Sobre la Renta con la tabla progresiva vigente, deducciones, retenciones y desglose por tramo.",
  category: "impuestos",
  businessTypes: ["servicios", "freelancer", "hogar"],
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  featured: true,
  seo: {
    title: "Calculadora de ISR Honduras 2026 en Excel (tabla progresiva) | Excel Codezun",
    description:
      "Calcula el ISR anual de personas naturales en Honduras en Excel con la tabla progresiva 2026, deducción de gastos médicos, retenciones y desglose por tramo.",
    keywords: [
      "calculo isr honduras",
      "tabla progresiva isr 2026",
      "impuesto sobre la renta personas naturales",
      "isr asalariados",
    ],
  },
  details: {
    includes: [
      "Ingresos por salarios, décimos, honorarios y otros",
      "Ingresos no gravables y deducciones permitidas",
      "Impuesto anual con desglose por tramo y tasa efectiva",
      "Retenciones del año e impuesto a pagar o saldo a favor",
      "Retención mensual sugerida",
    ],
    audience: ["Asalariados y profesionales independientes", "Contadores"],
  },
});
