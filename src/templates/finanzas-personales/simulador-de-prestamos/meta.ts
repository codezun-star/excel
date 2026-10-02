import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "simulador-de-prestamos",
  title: "Simulador de préstamos",
  shortDescription:
    "Tabla de amortización con cuota nivelada o capital constante, intereses por mes, abonos extra y fecha de cancelación.",
  category: "finanzas-personales",
  businessTypes: ["hogar", "comercio"],
  tier: "free",
  featured: true,
  seo: {
    title: "Simulador de préstamos en Excel gratis: tabla de amortización | Excel Codezun",
    description:
      "Calcula la cuota de tu préstamo y la tabla de amortización en Excel: cuota nivelada o decreciente, intereses, abonos extra y fecha del último pago.",
    keywords: [
      "simulador de prestamos excel",
      "tabla de amortizacion excel",
      "calcular cuota de prestamo",
      "cuota nivelada",
    ],
  },
  details: {
    includes: [
      "Cuota mensual con cuota nivelada o capital constante",
      "Tabla de amortización mes a mes con fechas",
      "Abono extra a capital para ver cuánto ahorras en intereses",
      "Total de intereses, total pagado y fecha del último pago",
    ],
    audience: [
      "Personas que comparan préstamos personales, de vehículo o de cooperativa",
      "Negocios que evalúan financiamiento",
    ],
  },
});
