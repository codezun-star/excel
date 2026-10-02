import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "deudas-y-tarjetas",
  title: "Control de deudas y tarjetas",
  shortDescription:
    "Tus deudas y tarjetas con interés mensual, meses para salir de cada una, fecha estimada y orden de pago bola de nieve o avalancha.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  seo: {
    title: "Plan para salir de deudas en Excel gratis (bola de nieve) | Excel Codezun",
    description:
      "Plantilla gratis para controlar deudas y tarjetas de crédito: interés mensual, meses para pagar, fecha estimada y plan bola de nieve o avalancha.",
    keywords: [
      "plan para salir de deudas excel",
      "método bola de nieve deudas",
      "control de tarjetas de crédito",
      "calculadora de deudas",
    ],
  },
  details: {
    includes: [
      "Deudas y tarjetas con saldo, tasa anual y pago mínimo",
      "Interés que pagas cada mes y meses para terminar de pagar",
      "Fecha estimada en que quedas libre de cada deuda",
      "Orden bola de nieve (menor saldo) y avalancha (mayor tasa), con tu dinero extra aplicado",
    ],
    audience: [
      "Personas y familias que quieren salir de deudas",
      "Quien tiene varias tarjetas de crédito",
    ],
  },
});
