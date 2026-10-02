import { fmtL, pct, round2 } from "../calc";
import type { Article } from "../types";

export const horasExtra: Article = {
  slug: "como-calcular-horas-extra-honduras",
  title: "Cómo calcular las horas extra en Honduras: diurnas, nocturnas y mixtas",
  seoTitle: "Cómo calcular horas extra en Honduras (con ejemplos)",
  description:
    "Calcula las horas extra en Honduras: valor de la hora ordinaria, recargos por jornada diurna, nocturna y mixta, ejemplos en lempiras y fórmula para Excel.",
  excerpt:
    "Saca el valor de tu hora ordinaria, aplica el recargo correcto según la jornada y suma tus extras del mes sin errores.",
  keywords: [
    "horas extra Honduras",
    "cómo calcular horas extras",
    "recargo hora extra nocturna",
    "jornada laboral Honduras",
    "pago de horas extra Código del Trabajo",
  ],
  category: "planilla",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["horas-extra", "control-de-asistencia", "planilla-de-sueldos"],
  regulated: true,
  faq: [
    {
      q: "¿Cuántas horas es la jornada ordinaria en Honduras?",
      a: "Según la tabla de reglas del sitio: jornada diurna de 8 horas diarias y 44 semanales, nocturna de 6 y 36, y mixta de 7 y 42. Verifica los valores vigentes en el Código del Trabajo.",
    },
    {
      q: "¿Cómo saco el valor de mi hora ordinaria?",
      a: "Divide tu salario mensual entre 30 días y luego entre las horas de tu jornada diaria. Con un salario de L 15,000 en jornada diurna: 15,000 ÷ 30 ÷ 8 = L 62.50 por hora.",
    },
    {
      q: "¿Las horas extra cuentan para el salario promedio de las prestaciones?",
      a: "Sí. El salario promedio de los últimos seis meses que se usa para preaviso y cesantía incluye las horas extra pagadas.",
    },
  ],
  body: (ctx) => {
    const salary = 15000;
    const w = ctx.labor.workdays;
    const hourly = round2(salary / 30 / w.day.hoursPerDay);
    const rows = ctx.labor.overtime.map((o) => {
      const rate = round2(hourly * (1 + o.surcharge));
      return { ...o, rate };
    });
    const diurna = rows[0]!;
    const total10 = round2(diurna.rate * 10);
    return [
      {
        type: "p",
        text: "Las horas extra son el tiempo trabajado después de la jornada ordinaria y se pagan con un **recargo** sobre el valor de la hora normal. El recargo depende de si la hora extra es diurna o nocturna. Así se calculan.",
      },
      { type: "h2", id: "jornadas", text: "Jornadas ordinarias" },
      {
        type: "table",
        head: ["Jornada", "Horas por día", "Horas por semana"],
        rows: [
          ["Diurna", String(w.day.hoursPerDay), String(w.day.hoursPerWeek)],
          ["Nocturna", String(w.night.hoursPerDay), String(w.night.hoursPerWeek)],
          ["Mixta", String(w.mixed.hoursPerDay), String(w.mixed.hoursPerWeek)],
        ],
      },
      { type: "h2", id: "recargos", text: "Recargos por hora extra" },
      {
        type: "table",
        head: ["Tipo", "Recargo", "Valor con salario de L 15,000 (diurna)"],
        rows: rows.map((o) => [o.label, `+${pct(o.surcharge)}`, `${fmtL(o.rate)} por hora`]),
      },
      { type: "h2", id: "paso-a-paso", text: "Cálculo paso a paso" },
      {
        type: "steps",
        items: [
          {
            title: "Calcula el salario diario",
            text: `Salario mensual ÷ 30. Con ${fmtL(salary)}: ${fmtL(round2(salary / 30))} diarios.`,
          },
          {
            title: "Calcula la hora ordinaria",
            text: `Salario diario ÷ horas de tu jornada. En jornada diurna: ${fmtL(round2(salary / 30))} ÷ ${w.day.hoursPerDay} = **${fmtL(hourly)}**.`,
          },
          {
            title: "Aplica el recargo",
            text: `Hora extra diurna = ${fmtL(hourly)} × ${1 + diurna.surcharge} = **${fmtL(diurna.rate)}**.`,
          },
          {
            title: "Multiplica por las horas del período",
            text: `10 horas extra diurnas en el mes = **${fmtL(total10)}** adicionales al salario.`,
          },
        ],
      },
      { type: "h2", id: "excel", text: "Fórmula en Excel" },
      {
        type: "formula",
        formula: "=REDONDEAR(B2/30/8*(1+C2)*D2,2)",
        caption:
          "B2: salario mensual · C2: recargo (por ejemplo 25 %) · D2: cantidad de horas extra. Cambia el 8 por las horas de la jornada.",
      },
      {
        type: "cta",
        template: "horas-extra",
        title: "Registra y paga las horas extra de todo tu personal",
        text: "Registra las horas extra de cada empleado por tipo: la plantilla calcula la hora ordinaria según la jornada, aplica el recargo de ley y resume el total por empleado.",
      },
      {
        type: "callout",
        tone: "info",
        text: "Lleva un registro diario con nuestra plantilla de [control de asistencia](/plantillas/control-de-asistencia): es tu respaldo si hay un reclamo, y alimenta la [planilla de sueldos](/blog/como-hacer-planilla-de-sueldos-excel-honduras).",
      },
    ];
  },
};
