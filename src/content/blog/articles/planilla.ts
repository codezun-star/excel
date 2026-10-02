import { employeeSocialSecurity, employerSocialSecurity, fmtL, pct, round2 } from "../calc";
import type { Article } from "../types";

export const planilla: Article = {
  slug: "como-hacer-planilla-de-sueldos-excel-honduras",
  title: "Cómo hacer una planilla de sueldos en Excel en Honduras (IHSS, RAP e ISR)",
  seoTitle: "Planilla de sueldos en Excel Honduras: IHSS, RAP e ISR",
  description:
    "Aprende a hacer la planilla de sueldos en Excel en Honduras: deducciones de IHSS y RAP, retención de ISR, aportes patronales y un ejemplo en lempiras.",
  excerpt:
    "Columnas que necesita tu planilla, cómo calcular IHSS, RAP e ISR, cuánto pagas como patrono y un ejemplo completo.",
  keywords: [
    "planilla de sueldos Honduras",
    "planilla en Excel Honduras",
    "deducciones IHSS RAP",
    "cómo calcular el IHSS",
    "planilla de pago Excel",
    "nómina Honduras Excel",
  ],
  category: "planilla",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["planilla-de-sueldos", "boleta-de-pago", "horas-extra", "control-de-asistencia"],
  regulated: true,
  faq: [
    {
      q: "¿Cuánto se le descuenta al empleado de IHSS en Honduras?",
      a: "Según la tabla de reglas del sitio, el empleado aporta un porcentaje para Enfermedad y Maternidad y otro para Invalidez, Vejez y Muerte, calculados sobre el salario hasta el techo vigente. Verifica las tasas actuales con el IHSS.",
    },
    {
      q: "¿Qué es el RAP y cómo se calcula?",
      a: "Es el Régimen de Aportaciones Privadas. La aportación se calcula sobre la parte del salario que excede el techo del IHSS, con un porcentaje para el trabajador y otro para el patrono.",
    },
    {
      q: "¿A todos los empleados se les retiene ISR?",
      a: "Solo cuando su ingreso anual proyectado supera el tramo exento de la tabla progresiva del ISR. La retención mensual es el impuesto anual estimado dividido entre los meses del año.",
    },
    {
      q: "¿La planilla funciona para pagos quincenales?",
      a: "Sí. Calcula el mes completo y divide entre dos, o usa la plantilla de planilla que permite elegir la periodicidad.",
    },
  ],
  body: (ctx) => {
    const salary = 15000;
    const ded = employeeSocialSecurity(salary, ctx);
    const dedTotal = round2(ded.reduce((s, d) => s + d.amount, 0));
    const emp = employerSocialSecurity(salary, ctx);
    const empTotal = round2(emp.reduce((s, d) => s + d.amount, 0));
    const ceiling = ctx.taxes.socialSecurity.find((s) => s.ceiling)?.ceiling ?? 0;
    return [
      {
        type: "p",
        text: "Hacer la planilla cada quincena o cada mes es una de las tareas que más tiempo consume en un negocio. Con una hoja de Excel bien armada, el cálculo de IHSS, RAP e ISR se hace solo y reduces errores que después cuestan multas. Esta es la estructura que recomendamos.",
      },
      { type: "h2", id: "columnas", text: "Columnas que debe tener tu planilla" },
      {
        type: "ol",
        items: [
          "Datos del empleado: nombre, DNI, cargo y fecha de ingreso.",
          "Salario base mensual y días trabajados en el período.",
          "Ingresos adicionales: [horas extra](/blog/como-calcular-horas-extra-honduras), comisiones y bonos.",
          "**Salario bruto** = salario devengado + ingresos adicionales.",
          "Deducciones: IHSS, RAP, retención de ISR, préstamos y anticipos.",
          "**Salario neto** = bruto − deducciones.",
          "Aportes patronales (no se descuentan al empleado, pero son costo de la empresa).",
        ],
      },
      { type: "h2", id: "ihss", text: "Cómo calcular el IHSS" },
      {
        type: "p",
        text: `Las cuotas del IHSS se calculan sobre el salario **hasta un techo de ${fmtL(ceiling)}** mensuales. Si alguien gana más, la cuota se calcula solo sobre el techo.`,
      },
      {
        type: "table",
        head: ["Concepto", "Empleado", "Patrono", "Base"],
        rows: ctx.taxes.socialSecurity.map((s) => [
          s.label,
          pct(s.employeeRate),
          pct(s.employerRate),
          s.base === "aboveCeiling" ? "Excedente del techo" : "Hasta el techo",
        ]),
        caption: "Tasas del módulo de reglas de Honduras del sitio (verifica las vigentes).",
      },
      { type: "h2", id: "ejemplo", text: "Ejemplo: empleado con salario de L 15,000" },
      {
        type: "example",
        title: "Deducciones del empleado",
        rows: [
          ["Salario mensual", fmtL(salary)],
          ...ded.map(
            (d) =>
              [`${d.label} (${pct(d.rate)} sobre ${fmtL(d.base)})`, `− ${fmtL(d.amount)}`] as [
                string,
                string,
              ],
          ),
        ],
        total: ["Salario neto antes de ISR", fmtL(round2(salary - dedTotal))],
      },
      {
        type: "example",
        title: "Costo patronal adicional",
        rows: emp.map((e) => [`${e.label} (${pct(e.rate)})`, fmtL(e.amount)] as [string, string]),
        total: ["Costo total para la empresa", fmtL(round2(salary + empTotal))],
      },
      { type: "h2", id: "isr", text: "Retención de ISR" },
      {
        type: "p",
        text: "Si el ingreso anual proyectado de un empleado supera el tramo exento de la tabla progresiva, debes retener ISR cada mes. Te explicamos el cálculo completo en [cómo calcular el ISR en Honduras](/blog/como-calcular-isr-honduras-personas-naturales).",
      },
      {
        type: "cta",
        template: "planilla-de-sueldos",
        title: "Planilla de sueldos para Honduras con IHSS, RAP e ISR automáticos",
        text: "Agrega a tus empleados y la plantilla calcula IHSS con techo, RAP sobre el excedente, retención de ISR, otras deducciones y aportes patronales. Las tasas están en una hoja de parámetros.",
      },
      { type: "h2", id: "buenas-practicas", text: "Buenas prácticas" },
      {
        type: "ul",
        items: [
          "Entrega a cada empleado su [boleta de pago](/hn/plantillas/boleta-de-pago) con el detalle de ingresos y deducciones.",
          "Guarda las tasas en una hoja de parámetros: cuando cambien, actualizas una sola celda.",
          "Provisiona cada mes el [aguinaldo](/blog/como-calcular-aguinaldo-decimo-tercer-mes-honduras) y el [décimo cuarto](/blog/como-calcular-decimo-cuarto-mes-honduras).",
          "Revisa que nadie quede por debajo del [salario mínimo](/blog/salario-minimo-honduras-2026).",
        ],
      },
    ];
  },
};
