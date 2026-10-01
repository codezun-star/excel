import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "planilla-de-sueldos",
  title: "Planilla de sueldos",
  shortDescription:
    "Planilla mensual con IHSS (EM e IVM) con techo, RAP sobre el excedente, retención de ISR, deducciones y aportes patronales.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "pro",
  regulated: "laboral",
  featured: true,
  seo: {
    title: "Planilla de sueldos en Excel Honduras con IHSS, RAP e ISR 2026 | Excel Codezun",
    description:
      "Planilla de pago en Excel para Honduras con deducciones de IHSS, RAP e ISR calculadas con los techos y tasas vigentes, aportes patronales y neto a pagar.",
    keywords: [
      "planilla de sueldos excel honduras",
      "planilla ihss rap",
      "calculo de planilla honduras",
      "planilla de pago excel",
    ],
  },
  details: {
    includes: [
      "Salario devengado por días laborados, horas extra y bonos",
      "IHSS Enfermedad y Maternidad e IVM con techo de cotización",
      "RAP sobre el excedente del techo del IHSS",
      "Retención mensual de ISR con tabla progresiva y deducción médica",
      "Aportes patronales (IHSS, RAP, INFOP, reserva laboral) y costo total",
      "Pago por quincena opcional",
    ],
    audience: [
      "Pequeñas y medianas empresas",
      "Contadores que llevan planillas de clientes",
      "ONG e instituciones",
    ],
  },
});
