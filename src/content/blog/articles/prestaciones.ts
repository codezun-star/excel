import {
  days360Inclusive,
  fmtL,
  noticeDays,
  proportionalBonus,
  round2,
  utc,
  vacationDaysFor,
} from "../calc";
import type { Article } from "../types";

export const prestaciones: Article = {
  slug: "como-calcular-prestaciones-laborales-honduras",
  title:
    "Cómo calcular las prestaciones laborales en Honduras: preaviso, cesantía, vacaciones y décimos",
  seoTitle: "Cómo calcular prestaciones laborales en Honduras (2026)",
  description:
    "Guía para calcular prestaciones laborales en Honduras: preaviso, auxilio de cesantía, vacaciones proporcionales y décimos, con un ejemplo completo en lempiras.",
  excerpt:
    "Qué te corresponde según el motivo de salida, cómo se calcula cada concepto y un ejemplo completo de liquidación.",
  keywords: [
    "prestaciones laborales Honduras",
    "cómo calcular prestaciones",
    "cesantía Honduras",
    "preaviso Honduras",
    "liquidación laboral Honduras",
    "calculadora de prestaciones Honduras",
  ],
  category: "planilla",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["prestaciones-laborales", "control-de-vacaciones", "decimo-tercer-y-cuarto-mes"],
  regulated: true,
  faq: [
    {
      q: "¿Si renuncio me pagan prestaciones?",
      a: "Al renunciar normalmente no corresponden preaviso ni auxilio de cesantía, pero sí las vacaciones pendientes y proporcionales y la parte proporcional del décimo tercer y décimo cuarto mes. Revisa tu caso con la Secretaría de Trabajo.",
    },
    {
      q: "¿Cuántos años de cesantía se pagan como máximo?",
      a: "La tabla de reglas que usamos aplica un mes de salario por año trabajado con un máximo de 25 años. Verifica el tope vigente con la legislación laboral.",
    },
    {
      q: "¿Qué salario se usa para la cesantía?",
      a: "El salario promedio de los últimos seis meses, que incluye horas extra y comisiones. Para vacaciones y décimos se usa el salario ordinario.",
    },
    {
      q: "¿En cuánto tiempo deben pagarme las prestaciones?",
      a: "Al terminar la relación laboral. Si no te pagan, puedes acudir a la Secretaría de Trabajo y Seguridad Social para una conciliación.",
    },
  ],
  body: (ctx) => {
    const start = "2022-03-01";
    const end = "2026-09-30";
    const salary = 18000;
    const avg = 18500;
    const d360 = days360Inclusive(utc(start), utc(end));
    const years = Math.floor(d360 / ctx.labor.dayBasis);
    const months = Math.floor(d360 / 30);
    const nDays = noticeDays(months, ctx);
    const notice = round2((nDays * avg) / 30);
    const sev = ctx.labor.severance;
    const severance = round2(
      Math.min(sev.maxMonths, (d360 / ctx.labor.dayBasis) * sev.monthsPerYear) * avg,
    );
    const vacEntitled = vacationDaysFor(years + 1, ctx);
    const vacDays = ((d360 - years * ctx.labor.dayBasis) / ctx.labor.dayBasis) * vacEntitled;
    const vacation = round2(vacDays * (salary / 30));
    const d13 = proportionalBonus(salary, days360Inclusive(utc("2026-01-01"), utc(end)), ctx);
    const d14 = proportionalBonus(salary, days360Inclusive(utc("2026-07-01"), utc(end)), ctx);
    const total = round2(notice + severance + vacation + d13 + d14);
    const reasons = ctx.labor.terminationReasons;
    return [
      {
        type: "p",
        text: "Cuando termina una relación laboral en Honduras, el empleador debe pagar una **liquidación** que puede incluir preaviso, auxilio de cesantía, vacaciones y la parte proporcional de los décimos. Lo que corresponde depende del **motivo de salida** y del **tiempo de servicio**. Esta guía te muestra cada concepto y un ejemplo completo.",
      },
      { type: "h2", id: "segun-motivo", text: "¿Qué corresponde según el motivo de salida?" },
      {
        type: "table",
        head: ["Motivo", "Preaviso", "Cesantía", "Vacaciones y décimos"],
        rows: reasons.map((r) => [
          r.label,
          r.notice ? "Sí" : "No",
          r.severance ? "Sí" : "No",
          "Sí",
        ]),
        caption: "Resumen según la tabla de reglas del sitio. Cada caso particular puede variar.",
      },
      { type: "h2", id: "preaviso", text: "1. Preaviso" },
      {
        type: "p",
        text: "Es el aviso anticipado que debe dar quien termina el contrato. Si el empleador despide sin dar ese aviso, debe pagarlo en dinero. Depende del tiempo trabajado:",
      },
      {
        type: "table",
        head: ["Tiempo de servicio", "Preaviso"],
        rows: ctx.labor.noticePeriod.map((n, i, all) => {
          const next = all[i + 1];
          const range = next
            ? `De ${n.fromMonths} a menos de ${next.fromMonths} meses`
            : `${n.fromMonths} meses o más`;
          return [range, n.label];
        }),
      },
      { type: "h2", id: "cesantia", text: "2. Auxilio de cesantía" },
      {
        type: "p",
        text: `Corresponde en despidos sin causa justificada. Después del primer año se paga **${sev.monthsPerYear} mes de salario promedio por cada año trabajado** (y la fracción proporcional), hasta un máximo de **${sev.maxMonths} meses**. Con menos de un año, la tabla es:`,
      },
      {
        type: "table",
        head: ["Tiempo de servicio", "Cesantía"],
        rows: sev.underOneYear.map((s, i, all) => {
          const next = all[i + 1];
          return [
            next
              ? `De ${s.fromMonths} a menos de ${next.fromMonths} meses`
              : `De ${s.fromMonths} a 12 meses`,
            s.label,
          ];
        }),
      },
      { type: "h2", id: "vacaciones", text: "3. Vacaciones" },
      {
        type: "p",
        text: `Se pagan las vacaciones que no gozaste y la parte proporcional del año en curso. Los días aumentan con la antigüedad: ${ctx.labor.vacationDays.map((v) => `${v.days} días desde el año ${v.fromYears}`).join(", ")}. Lleva el control con nuestra [plantilla de vacaciones](/hn/plantillas/control-de-vacaciones).`,
      },
      { type: "h2", id: "decimos", text: "4. Décimo tercer y décimo cuarto mes proporcionales" },
      {
        type: "p",
        text: "Se paga lo acumulado del [aguinaldo](/blog/como-calcular-aguinaldo-decimo-tercer-mes-honduras) desde el 1 de enero y del [décimo cuarto](/blog/como-calcular-decimo-cuarto-mes-honduras) desde el 1 de julio hasta el último día trabajado.",
      },
      { type: "h2", id: "ejemplo", text: "Ejemplo completo de liquidación" },
      {
        type: "p",
        text: `María trabajó del **1 de marzo de 2022 al 30 de septiembre de 2026** y fue despedida sin causa justificada. Su salario ordinario era ${fmtL(salary)} y su promedio de los últimos seis meses (con horas extra) ${fmtL(avg)}.`,
      },
      {
        type: "example",
        title: `Tiempo de servicio: ${d360} días (${years} años completos)`,
        rows: [
          [`Preaviso (${nDays} días de salario promedio)`, fmtL(notice)],
          [
            `Cesantía (${round2(d360 / ctx.labor.dayBasis)} años × salario promedio)`,
            fmtL(severance),
          ],
          [`Vacaciones proporcionales (${round2(vacDays)} días)`, fmtL(vacation)],
          ["Décimo tercer mes proporcional", fmtL(d13)],
          ["Décimo cuarto mes proporcional", fmtL(d14)],
        ],
        total: ["Total de la liquidación", fmtL(total)],
      },
      {
        type: "cta",
        template: "prestaciones-laborales",
        title: "Calcula una liquidación completa en minutos",
        text: "Escribe fechas, salarios y motivo de salida: la plantilla aplica preaviso, cesantía, vacaciones, décimos y salarios pendientes con fórmulas que puedes revisar.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Cada caso puede tener particularidades",
        text: "Contratos por obra, trabajadoras embarazadas, licencias o salarios variables pueden cambiar el cálculo. Usa la plantilla como apoyo y confirma con la Secretaría de Trabajo o un abogado laboral.",
      },
    ];
  },
};
