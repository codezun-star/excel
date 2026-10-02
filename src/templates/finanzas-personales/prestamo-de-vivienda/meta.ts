import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "prestamo-de-vivienda",
  title: "Préstamo de vivienda",
  shortDescription:
    "Amortización hipotecaria con prima, seguros mensuales, abonos extra a capital y ahorro en intereses, para plazos de hasta 30 años.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  details: {
    includes: [
      "Valor de la vivienda, prima y monto a financiar",
      "Cuota con seguros de vida y daños incluidos",
      "Tabla de amortización de hasta 360 cuotas",
      "Efecto de los abonos extra en el plazo y los intereses",
    ],
    audience: [
      "Familias que planean comprar casa",
      "Quienes comparan ofertas de bancos y cooperativas",
    ],
  },
});
