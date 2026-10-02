import { fmtL, monthlyPayment, round2 } from "../calc";
import type { Article } from "../types";

export const prestamo: Article = {
  slug: "como-calcular-cuota-prestamo-excel",
  title: "Cómo calcular la cuota de un préstamo en Excel (fórmula PAGO) en lempiras",
  seoTitle: "Cómo calcular la cuota de un préstamo en Excel (PAGO)",
  description:
    "Calcula la cuota mensual de un préstamo personal, de vehículo o de vivienda con la fórmula PAGO de Excel, intereses totales y tabla de amortización en lempiras.",
  excerpt:
    "La fórmula PAGO explicada, cuánto pagas de intereses en total y cómo comparar ofertas de bancos y cooperativas.",
  keywords: [
    "calcular cuota préstamo",
    "fórmula PAGO Excel",
    "tabla de amortización Excel",
    "simulador de préstamo Honduras",
    "préstamo de vivienda cuota",
    "intereses préstamo personal",
  ],
  category: "finanzas",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["simulador-de-prestamos", "prestamo-de-vivienda", "presupuesto-mensual"],
  faq: [
    {
      q: "¿La tasa que da el banco es anual o mensual?",
      a: "Casi siempre es una tasa nominal anual. Para la fórmula PAGO divídela entre 12 para obtener la tasa mensual.",
    },
    {
      q: "¿La cuota incluye seguros?",
      a: "La fórmula PAGO calcula capital e intereses. Los bancos suelen sumar seguros de vida, de daños o comisiones; pide el detalle para compararlo.",
    },
    {
      q: "¿Conviene pagar capital adelantado?",
      a: "En general sí: reduce el saldo sobre el que se calculan los intereses. Revisa si tu contrato cobra penalización por pago anticipado.",
    },
  ],
  body: () => {
    const principal = 200000;
    const rate = 0.18;
    const months = 36;
    const pay = monthlyPayment(principal, rate, months);
    const interest = round2(pay * months - principal);
    const pay48 = monthlyPayment(principal, rate, 48);
    const interest48 = round2(pay48 * 48 - principal);
    return [
      {
        type: "p",
        text: "Antes de firmar un préstamo con un banco o una cooperativa, conviene saber exactamente cuánto vas a pagar cada mes y cuánto pagarás de intereses en total. Excel lo calcula con una sola fórmula: **PAGO**.",
      },
      { type: "h2", id: "formula", text: "La fórmula PAGO" },
      {
        type: "formula",
        formula: "=PAGO(tasa_anual/12, número_de_meses, -monto)",
        caption:
          "En Excel en inglés se llama PMT. El signo negativo hace que la cuota salga positiva.",
      },
      {
        type: "example",
        title: `Préstamo de ${fmtL(principal)} al 18 % anual`,
        rows: [
          ["Plazo", `${months} meses`],
          ["Fórmula", `=PAGO(18%/12, ${months}, -${principal})`],
          ["Cuota mensual", fmtL(pay)],
          ["Total pagado", fmtL(round2(pay * months))],
        ],
        total: ["Intereses totales", fmtL(interest)],
      },
      {
        type: "p",
        text: `Si alargas el plazo a 48 meses, la cuota baja a **${fmtL(pay48)}**, pero los intereses suben a **${fmtL(interest48)}**. Una cuota más baja no siempre es un mejor préstamo.`,
      },
      { type: "h2", id: "comparar", text: "Cómo comparar ofertas" },
      {
        type: "ul",
        items: [
          "Compara siempre con el **mismo monto y plazo**.",
          "Pide la tasa anual y todos los cargos (seguros, comisión de desembolso, avalúo).",
          "Mira el **total pagado**, no solo la cuota.",
          "Asegúrate de que la cuota no pase del 30 % al 40 % de tu ingreso mensual. Haz la prueba en tu [presupuesto mensual](/plantillas/presupuesto-mensual).",
        ],
      },
      {
        type: "cta",
        template: "simulador-de-prestamos",
        title: "Simulador de préstamos con tabla de amortización",
        text: "Cuota nivelada o capital constante, intereses y saldo mes a mes, abonos extra a capital y fecha de cancelación.",
      },
      {
        type: "cta",
        template: "prestamo-de-vivienda",
        title: "¿Vas a comprar casa?",
        text: "La plantilla de préstamo de vivienda incluye prima, seguros mensuales, abonos extra y cuánto ahorras en intereses, con plazos de hasta 30 años.",
      },
    ];
  },
};
