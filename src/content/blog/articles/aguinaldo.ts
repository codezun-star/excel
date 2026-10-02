import { days360Inclusive, fmtL, proportionalBonus, utc } from "../calc";
import type { Article } from "../types";

export const aguinaldo: Article = {
  slug: "como-calcular-aguinaldo-decimo-tercer-mes-honduras",
  title: "Aguinaldo en Honduras: cómo calcular el décimo tercer mes paso a paso",
  seoTitle: "Aguinaldo Honduras 2026: cómo calcular el décimo tercer mes",
  description:
    "Cómo calcular el aguinaldo o décimo tercer mes en Honduras: período de enero a diciembre, proporcional por días trabajados, ejemplos en lempiras y fórmula de Excel.",
  excerpt:
    "El décimo tercer mes explicado sin enredos: período, cálculo proporcional, ejemplo en lempiras y la plantilla que lo hace por ti.",
  keywords: [
    "aguinaldo Honduras",
    "décimo tercer mes Honduras",
    "cómo calcular el aguinaldo",
    "aguinaldo proporcional",
    "treceavo Honduras",
    "aguinaldo 2026 Honduras",
  ],
  category: "planilla",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["decimo-tercer-y-cuarto-mes", "planilla-de-sueldos", "boleta-de-pago"],
  regulated: true,
  faq: [
    {
      q: "¿Cuándo se paga el aguinaldo en Honduras?",
      a: "En diciembre. Cubre lo trabajado del 1 de enero al 31 de diciembre del mismo año. Confirma la fecha límite vigente con la Secretaría de Trabajo.",
    },
    {
      q: "¿Cuánto es el aguinaldo si trabajé seis meses?",
      a: "Aproximadamente medio salario: salario mensual × 180 días ÷ 360. Si entraste a mitad de mes, cuenta los días exactos con meses de 30 días.",
    },
    {
      q: "¿El aguinaldo tiene deducciones?",
      a: "No se le descuentan las cuotas de IHSS ni RAP. Para el ISR, consulta con tu contador cómo se integra a tus ingresos anuales.",
    },
    {
      q: "¿Aguinaldo y décimo tercer mes son lo mismo?",
      a: "Sí. En Honduras se usan como sinónimos para el salario adicional que se paga en diciembre.",
    },
  ],
  body: (ctx) => {
    const t = ctx.labor.thirteenthMonth;
    const salary = 12000;
    const days = days360Inclusive(utc("2026-04-01"), utc("2026-12-31"));
    const prop = proportionalBonus(salary, days, ctx);
    const exitDays = days360Inclusive(utc("2026-01-01"), utc("2026-08-15"));
    const exitProp = proportionalBonus(18000, exitDays, ctx);
    return [
      {
        type: "p",
        text: `El **aguinaldo** o **${t.label.toLowerCase()}** es un salario extra que se paga en **${t.paymentDeadline.toLowerCase()}** a todos los trabajadores. Si trabajaste todo el año recibes un mes completo; si no, la parte proporcional. Aquí está el cálculo explicado con ejemplos reales en lempiras.`,
      },
      { type: "h2", id: "periodo", text: "Período del aguinaldo" },
      {
        type: "p",
        text: "El aguinaldo cubre del **1 de enero al 31 de diciembre** del mismo año. No lo confundas con el [décimo cuarto mes](/blog/como-calcular-decimo-cuarto-mes-honduras), que va de julio a junio y se paga en junio.",
      },
      { type: "h2", id: "formula", text: "La fórmula del aguinaldo" },
      {
        type: "p",
        text: `**Aguinaldo = salario mensual × días trabajados en el año ÷ ${ctx.labor.dayBasis}**. Los días se cuentan con meses comerciales de 30 días, igual que en el resto de cálculos laborales.`,
      },
      {
        type: "example",
        title: "Ejemplo 1: entró el 1 de abril",
        rows: [
          ["Salario mensual", fmtL(salary)],
          ["Del 01/04/2026 al 31/12/2026", `${days} días`],
          ["Cálculo", `${fmtL(salary)} × ${days} ÷ ${ctx.labor.dayBasis}`],
        ],
        total: ["Aguinaldo", fmtL(prop)],
      },
      {
        type: "example",
        title: "Ejemplo 2: renunció el 15 de agosto",
        rows: [
          ["Salario mensual", fmtL(18000)],
          ["Del 01/01/2026 al 15/08/2026", `${exitDays} días`],
        ],
        total: ["Aguinaldo proporcional en la liquidación", fmtL(exitProp)],
      },
      { type: "h2", id: "excel", text: "Cómo calcularlo en Excel" },
      {
        type: "formula",
        formula: "=REDONDEAR(B2*MIN(360,DIAS360(MAX(C2,FECHA(AÑO(D2),1,1)),D2,VERDADERO)+1)/360,2)",
        caption:
          "B2: salario mensual · C2: fecha de ingreso · D2: fecha de corte (31 de diciembre o fecha de salida).",
      },
      {
        type: "cta",
        template: "decimo-tercer-y-cuarto-mes",
        title: "Plantilla de aguinaldo y décimo cuarto para toda tu planilla",
        text: "Calcula ambos décimos para cada empleado según su fecha de ingreso, completos o proporcionales, con el total a pagar.",
      },
      { type: "h2", id: "consejos", text: "Consejos para empleadores" },
      {
        type: "ul",
        items: [
          "Provisiona cada mes 1/12 del salario para no descapitalizarte en diciembre.",
          "Entrega un comprobante con el cálculo: evita reclamos y sirve ante una inspección.",
          "Si alguien sale antes de diciembre, inclúyelo en su [cálculo de prestaciones](/blog/como-calcular-prestaciones-laborales-honduras).",
          "Lleva tus pagos ordenados con una [boleta de pago](/hn/plantillas/boleta-de-pago) por empleado.",
        ],
      },
    ];
  },
};
