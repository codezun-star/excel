import { days360Inclusive, fmtL, proportionalBonus, utc } from "../calc";
import type { Article } from "../types";

export const decimoCuartoMes: Article = {
  slug: "como-calcular-decimo-cuarto-mes-honduras",
  title: "Cómo calcular el décimo cuarto mes en Honduras (con ejemplos y plantilla de Excel)",
  seoTitle: "Cómo calcular el décimo cuarto mes en Honduras 2026",
  description:
    "Calcula el décimo cuarto mes en Honduras paso a paso: período de julio a junio, salario completo o proporcional, fórmula en Excel y plantilla lista para tu planilla.",
  excerpt:
    "Quién lo recibe, qué período cubre, cómo sacar el proporcional por días trabajados y la fórmula exacta para Excel.",
  keywords: [
    "décimo cuarto mes Honduras",
    "cómo calcular el décimo cuarto",
    "decimo cuarto proporcional",
    "catorceavo Honduras",
    "décimo cuarto 2026",
    "calculadora décimo cuarto mes",
  ],
  category: "planilla",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["decimo-tercer-y-cuarto-mes", "planilla-de-sueldos", "prestaciones-laborales"],
  regulated: true,
  faq: [
    {
      q: "¿Cuándo se paga el décimo cuarto mes en Honduras?",
      a: "Se paga en junio y cubre el período del 1 de julio del año anterior al 30 de junio del año en curso. Verifica la fecha límite vigente con la Secretaría de Trabajo.",
    },
    {
      q: "¿Me corresponde el décimo cuarto si no trabajé todo el año?",
      a: "Sí. Si trabajaste solo una parte del período, recibes la parte proporcional a los días trabajados: salario mensual × días trabajados ÷ 360.",
    },
    {
      q: "¿El décimo cuarto se paga si renuncio o me despiden?",
      a: "Sí. Al terminar la relación laboral se paga la parte proporcional acumulada desde el 1 de julio hasta tu último día, junto con el resto de tus derechos.",
    },
    {
      q: "¿Se calcula con el salario de junio o con un promedio?",
      a: "Se toma el salario ordinario mensual. Si tu salario cambió durante el período o recibes comisiones, consulta con la Secretaría de Trabajo o tu contador cómo promediarlo en tu caso.",
    },
  ],
  body: (ctx) => {
    const fourteenth = ctx.labor.fourteenthMonth;
    const salary = 15000;
    const start = "2026-01-15";
    const end = "2026-06-30";
    const days = days360Inclusive(utc(start), utc(end));
    const proportional = proportionalBonus(salary, days, ctx);
    return [
      {
        type: "p",
        text: `El **${fourteenth.label.toLowerCase()}** es un salario adicional que todo trabajador en Honduras recibe una vez al año, en **${fourteenth.paymentDeadline.toLowerCase()}**. Equivale a un mes de salario si trabajaste el período completo, o a la parte proporcional si entraste o saliste a mitad de camino. En esta guía te mostramos cómo calcularlo sin errores y cómo dejarlo automatizado en Excel.`,
      },
      { type: "h2", id: "quien-lo-recibe", text: "¿Quién tiene derecho al décimo cuarto mes?" },
      {
        type: "ul",
        items: [
          "Todos los trabajadores con contrato de trabajo, sea por tiempo indefinido o determinado.",
          "Empleados de comercio, industria, servicios, maquila, agro y trabajo doméstico.",
          "Quien no trabajó el período completo recibe la parte **proporcional** a los días laborados.",
          "Al terminar la relación laboral (renuncia, despido o fin de contrato) se paga lo acumulado.",
        ],
      },
      { type: "h2", id: "periodo", text: "¿Qué período cubre?" },
      {
        type: "p",
        text: `El período va del **1 de julio del año anterior al 30 de junio** del año de pago. Por ejemplo, el décimo cuarto que se paga en junio de 2026 corresponde a lo trabajado entre el 1 de julio de 2025 y el 30 de junio de 2026.`,
      },
      { type: "h2", id: "como-calcularlo", text: "Cómo calcularlo paso a paso" },
      {
        type: "steps",
        items: [
          {
            title: "Identifica el salario ordinario mensual",
            text: "Es el salario base que recibes cada mes. Si ganas por quincena, multiplica la quincena por 2.",
          },
          {
            title: "Cuenta los días trabajados en el período",
            text: `Se usan meses comerciales de 30 días (año de ${ctx.labor.dayBasis} días). Si trabajaste del 1 de julio al 30 de junio, son ${ctx.labor.dayBasis} días.`,
          },
          {
            title: "Aplica la fórmula",
            text: `**Décimo cuarto = salario mensual × días trabajados ÷ ${ctx.labor.dayBasis}**. Si trabajaste todo el período, el resultado es exactamente un salario.`,
          },
          {
            title: "Redondea a centavos y regístralo en la planilla",
            text: "El pago no lleva deducciones de IHSS ni RAP. Guarda el comprobante firmado por el trabajador.",
          },
        ],
      },
      {
        type: "example",
        title: "Ejemplo: período completo",
        rows: [
          ["Salario mensual", fmtL(salary)],
          ["Días trabajados", `${ctx.labor.dayBasis}`],
        ],
        total: ["Décimo cuarto", fmtL(salary)],
      },
      {
        type: "example",
        title: `Ejemplo: entró el 15 de enero de 2026`,
        rows: [
          ["Salario mensual", fmtL(salary)],
          ["Del 15/01/2026 al 30/06/2026", `${days} días (base ${ctx.labor.dayBasis})`],
          ["Cálculo", `${fmtL(salary)} × ${days} ÷ ${ctx.labor.dayBasis}`],
        ],
        total: ["Décimo cuarto proporcional", fmtL(proportional)],
      },
      { type: "h2", id: "formula-excel", text: "La fórmula en Excel" },
      {
        type: "p",
        text: "Si tienes el salario en la columna B, la fecha de ingreso en C y la fecha de corte (30 de junio) en D, esta fórmula calcula el décimo cuarto de cada empleado, tomando en cuenta solo los días dentro del período:",
      },
      {
        type: "formula",
        formula:
          "=REDONDEAR(B2*MIN(360,DIAS360(MAX(C2,FECHA(AÑO(D2)-1,7,1)),D2,VERDADERO)+1)/360,2)",
        caption:
          "DIAS360 con el método europeo (VERDADERO) cuenta meses de 30 días. Si tu Excel usa punto y coma como separador, cambia las comas por «;».",
      },
      {
        type: "cta",
        template: "decimo-tercer-y-cuarto-mes",
        title: "Calcula el décimo tercero y cuarto de toda tu planilla en un archivo",
        text: "Escribe nombre, salario y fecha de ingreso de cada empleado: la plantilla calcula días, montos completos o proporcionales y totales con fórmulas reales.",
      },
      { type: "h2", id: "errores-comunes", text: "Errores comunes al calcular el décimo cuarto" },
      {
        type: "ul",
        items: [
          "Contar los días con el calendario real (365) en lugar de meses de 30 días.",
          "Tomar el período de enero a diciembre: ese es el del [aguinaldo o décimo tercer mes](/blog/como-calcular-aguinaldo-decimo-tercer-mes-honduras).",
          "Aplicar deducciones de IHSS o RAP al décimo cuarto.",
          "Olvidar incluirlo en la [liquidación por prestaciones](/blog/como-calcular-prestaciones-laborales-honduras) cuando alguien deja la empresa.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Planifica el gasto desde enero",
        text: "Para que junio no te tome por sorpresa, separa cada mes 1/12 del salario de cada empleado. Lleva el resto de tus pagos en la [planilla de sueldos](/hn/plantillas/planilla-de-sueldos).",
      },
    ];
  },
};
