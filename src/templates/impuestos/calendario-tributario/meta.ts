import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "calendario-tributario",
  title: "Calendario tributario",
  shortDescription:
    "Fechas de vencimiento del año (ISV mensual, declaración anual de ISR, décimos) con días restantes, estado y alertas de colores.",
  category: "impuestos",
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  details: {
    includes: [
      "Vencimientos mensuales de la declaración del ISV",
      "Declaración anual del ISR y pagos de décimos",
      "Días restantes, estado de cada obligación y alertas",
      "Filas libres para agregar obligaciones propias (municipales, IHSS, RAP)",
    ],
    audience: ["Contribuyentes y contadores que llevan varias obligaciones"],
  },
});
