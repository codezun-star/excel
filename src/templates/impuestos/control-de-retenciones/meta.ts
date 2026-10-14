import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "control-de-retenciones",
  title: "Control de retenciones",
  shortDescription:
    "Registro de retenciones de ISR e ISV efectuadas y recibidas con constancias, vencimiento del entero y resumen mensual.",
  category: "impuestos",
  businessTypes: ["comercio", "servicios", "constructora", "freelancer"],
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  seo: {
    title: "Control de retenciones de ISR e ISV en Excel (Honduras) | Excel Codezun",
    description:
      "Lleva en Excel las retenciones de ISR e ISV que efectúas y las que te hacen: tasa por concepto, constancias, fecha para enterar al SAR y resumen por mes.",
    keywords: [
      "control de retenciones excel",
      "retencion isr honorarios 12.5",
      "retencion 1% honduras",
      "constancia de retencion sar",
    ],
  },
  details: {
    includes: [
      "Retenciones que efectúas (por enterar) y las que te efectúan (crédito a tu favor)",
      "Tasa por concepto tomada de Parámetros: honorarios, 1 % sobre compras, dividendos y más",
      "Número de constancia, fecha de entero y alerta de retenciones vencidas",
      "Resumen mensual por impuesto y resumen por concepto",
    ],
    audience: ["Agentes de retención", "Profesionales y empresas a quienes les retienen"],
  },
});
