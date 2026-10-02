import { fmtDate, fmtL, round2 } from "../calc";
import type { Article } from "../types";

export const salarioMinimo: Article = {
  slug: "salario-minimo-honduras-2026",
  title: "Salario mínimo en Honduras 2026: tabla por sector y tamaño de empresa",
  seoTitle: "Salario mínimo Honduras 2026: tabla por sector",
  description:
    "Tabla del salario mínimo en Honduras 2026 por actividad económica y número de empleados, salario diario equivalente y cómo verificar que tu planilla cumple.",
  excerpt:
    "Consulta el salario mínimo por sector y tamaño de empresa, su equivalente diario y cómo revisar tu planilla.",
  keywords: [
    "salario mínimo Honduras 2026",
    "tabla salario mínimo Honduras",
    "salario mínimo por sector Honduras",
    "aumento salario mínimo 2026",
    "salario mínimo diario Honduras",
  ],
  category: "planilla",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["salario-minimo", "planilla-de-sueldos"],
  regulated: true,
  faq: [
    {
      q: "¿De qué depende el salario mínimo en Honduras?",
      a: "De la actividad económica de la empresa y de su número de empleados. Por eso hay una tabla con varios montos y no un único salario mínimo.",
    },
    {
      q: "¿Cómo calculo el salario mínimo diario?",
      a: "Divide el salario mínimo mensual entre 30.",
    },
    {
      q: "¿Dónde se publica el salario mínimo oficial?",
      a: "La Secretaría de Trabajo y Seguridad Social lo publica mediante acuerdo ejecutivo en el diario oficial La Gaceta. Verifica siempre la tabla oficial.",
    },
  ],
  body: (ctx) => {
    const mw = ctx.labor.minimumWage;
    return [
      {
        type: "p",
        text: `En Honduras el salario mínimo **varía según la actividad económica y el tamaño de la empresa**. La tabla de esta página usa los valores del módulo de reglas del sitio (${mw.agreement}, vigente desde el ${fmtDate(mw.effectiveFrom)}). Los montos marcados «Por verificar» aún no se han cargado: confírmalos con la tabla oficial de la Secretaría de Trabajo.`,
      },
      { type: "h2", id: "tabla", text: "Tabla de salario mínimo mensual" },
      {
        type: "table",
        head: ["Actividad", ...mw.companySizes.map((s) => `${s} empleados`)],
        rows: mw.table.map((row) => [
          row.sector,
          ...mw.companySizes.map((size) => {
            const amount = row.monthly.find((m) => m.size === size)?.amount;
            return amount ? fmtL(amount) : "Por verificar";
          }),
        ]),
        caption:
          "Montos mensuales en lempiras. Fuente: módulo de reglas de Honduras del sitio, pendiente de verificación oficial.",
      },
      {
        type: "p",
        text: `El **salario mínimo promedio** de referencia es ${fmtL(mw.averageMonthly)} mensuales, equivalente a ${fmtL(round2(mw.averageMonthly / 30))} diarios.`,
      },
      { type: "h2", id: "como-verificar", text: "Cómo verificar que tu planilla cumple" },
      {
        type: "steps",
        items: [
          {
            title: "Ubica tu actividad",
            text: "Usa la actividad principal registrada de tu empresa.",
          },
          {
            title: "Cuenta tus empleados",
            text: "El rango depende del número total de trabajadores.",
          },
          {
            title: "Compara salario por salario",
            text: "Nadie con jornada completa debe ganar menos del mínimo de tu rango. Si alguien trabaja media jornada, compara con la parte proporcional.",
          },
          {
            title: "Recalcula lo que depende del salario",
            text: "Al subir el salario cambian las cuotas de IHSS y RAP, los décimos y la provisión de prestaciones.",
          },
        ],
      },
      {
        type: "cta",
        template: "salario-minimo",
        title: "Consulta y compara el salario mínimo en Excel",
        text: "La plantilla trae la tabla por rama de actividad y tamaño de empresa, y un verificador te dice si cada empleado gana el mínimo.",
      },
      {
        type: "callout",
        tone: "tip",
        text: "¿Vas a ajustar salarios? Recalcula todo de una vez con la [planilla de sueldos](/blog/como-hacer-planilla-de-sueldos-excel-honduras) y revisa el impacto en el [décimo cuarto mes](/blog/como-calcular-decimo-cuarto-mes-honduras).",
      },
    ];
  },
};
