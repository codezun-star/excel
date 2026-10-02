import { annualIncomeTax, fmtL, pct, round2 } from "../calc";
import type { Article } from "../types";

export const isr: Article = {
  slug: "como-calcular-isr-honduras-personas-naturales",
  title: "Cómo calcular el ISR en Honduras: tabla progresiva y ejemplo para asalariados",
  seoTitle: "Cómo calcular el ISR en Honduras 2026 (tabla y ejemplo)",
  description:
    "Calcula el Impuesto Sobre la Renta en Honduras: tabla progresiva 2026, deducciones, ejemplo para un salario mensual y retención mensual en planilla.",
  excerpt:
    "La tabla progresiva explicada con un ejemplo real: cuánto ISR anual corresponde a un salario y cuánto retener cada mes.",
  keywords: [
    "ISR Honduras",
    "cómo calcular el ISR",
    "tabla ISR 2026 Honduras",
    "impuesto sobre la renta asalariados",
    "retención ISR planilla",
    "declaración anual ISR Honduras",
  ],
  category: "impuestos",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["isr-personas-naturales", "planilla-de-sueldos", "calendario-tributario"],
  regulated: true,
  faq: [
    {
      q: "¿A partir de cuánto se paga ISR en Honduras?",
      a: "Cuando la renta neta gravable anual supera el primer tramo exento de la tabla progresiva. Con la tabla del módulo de reglas del sitio, el primer tramo exento llega a L 228,324.32 anuales.",
    },
    {
      q: "¿La tasa se aplica a todo mi ingreso?",
      a: "No. Es progresiva: cada tasa se aplica solo a la parte del ingreso que cae dentro de su tramo.",
    },
    {
      q: "¿Cuándo se presenta la declaración anual?",
      a: "Según el módulo de reglas del sitio, a más tardar el 30 de abril del año siguiente. Confirma la fecha vigente con el SAR.",
    },
  ],
  body: (ctx) => {
    const it = ctx.taxes.incomeTax;
    const monthly = 40000;
    const annual = monthly * 12;
    const deductions = it.standardDeductions.reduce((s, d) => s + d.amount, 0);
    const taxable = annual - deductions;
    const result = annualIncomeTax(taxable, ctx);
    const monthlyWithholding = round2(result.total / it.withholding.projectionMonths);
    return [
      {
        type: "p",
        text: `El ${it.name} grava los ingresos anuales de las personas. Para los asalariados, el patrono retiene una parte cada mes y al final del año se hace la declaración. La clave es entender que la tabla es **progresiva**: cada tasa se aplica solo al pedazo de ingreso que cae en su tramo.`,
      },
      { type: "h2", id: "tabla", text: `Tabla progresiva ${it.fiscalYear}` },
      {
        type: "table",
        head: ["Renta neta gravable anual", "Tasa"],
        rows: it.brackets.map((b) => [
          b.to === null ? `Más de ${fmtL(b.from)}` : `De ${fmtL(b.from)} a ${fmtL(b.to)}`,
          b.rate === 0 ? "Exento" : pct(b.rate),
        ]),
        caption:
          "Valores del módulo de reglas del sitio; verifica la tabla oficial publicada por el SAR.",
      },
      { type: "h2", id: "ejemplo", text: `Ejemplo: salario de ${fmtL(monthly)} mensuales` },
      {
        type: "example",
        title: "Cálculo anual",
        rows: [
          ["Ingreso anual (12 meses)", fmtL(annual)],
          ...it.standardDeductions.map((d) => [d.label, `− ${fmtL(d.amount)}`] as [string, string]),
          ["Renta neta gravable", fmtL(taxable)],
          ...result.rows
            .filter((r) => r.amountInBracket > 0)
            .map(
              (r) =>
                [
                  `${r.rate === 0 ? "Tramo exento" : `Tramo al ${pct(r.rate)}`} (${fmtL(r.amountInBracket)})`,
                  fmtL(r.tax),
                ] as [string, string],
            ),
        ],
        total: ["ISR anual estimado", fmtL(result.total)],
      },
      {
        type: "p",
        text: `La **retención mensual** sería aproximadamente ${fmtL(result.total)} ÷ ${it.withholding.projectionMonths} = **${fmtL(monthlyWithholding)}**. Si el salario cambia durante el año, la proyección se recalcula.`,
      },
      {
        type: "callout",
        tone: "info",
        text: "Este ejemplo es simplificado: no incluye otros ingresos, décimos, ni deducciones adicionales a las que podrías tener derecho. Tu contador puede ayudarte a optimizar tu declaración.",
      },
      {
        type: "cta",
        template: "isr-personas-naturales",
        title: "Calcula tu ISR anual y la retención mensual",
        text: "Ingresa tus ingresos, deducciones y retenciones: la plantilla aplica la tabla progresiva tramo por tramo y te muestra el desglose.",
      },
      {
        type: "p",
        text: "Si manejas una empresa, la retención se calcula dentro de la [planilla de sueldos](/blog/como-hacer-planilla-de-sueldos-excel-honduras). Y para no olvidar fechas, usa el [calendario tributario](/hn/plantillas/calendario-tributario).",
      },
    ];
  },
};
