/** Calculadoras interactivas para Honduras (páginas de alta intención de búsqueda). */
export interface CalculatorMeta {
  slug: string;
  /** H1 visible */
  title: string;
  /** Nombre corto para listados */
  name: string;
  seoTitle: string;
  description: string;
  keywords: string[];
  intro: string;
  /** Plantilla a la que lleva el resultado */
  template: string;
  /** Guía del blog que explica el cálculo */
  guide: string;
  regulated: boolean;
  faq: { q: string; a: string }[];
}

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: "decimo-cuarto-mes",
    name: "Décimo cuarto mes",
    title: "Calculadora del décimo cuarto mes en Honduras",
    seoTitle: "Calculadora décimo cuarto mes Honduras 2026",
    description:
      "Calcula gratis tu décimo cuarto mes en Honduras: completo o proporcional según tu fecha de ingreso, con días trabajados base 360 y resultado al instante.",
    keywords: [
      "calculadora décimo cuarto mes",
      "calcular décimo cuarto Honduras",
      "décimo cuarto proporcional",
      "catorceavo calculadora",
    ],
    intro:
      "Escribe tu salario y tu fecha de ingreso: te decimos cuánto te toca del décimo cuarto mes, completo o proporcional.",
    template: "decimo-tercer-y-cuarto-mes",
    guide: "como-calcular-decimo-cuarto-mes-honduras",
    regulated: true,
    faq: [
      {
        q: "¿Qué período cubre el décimo cuarto mes?",
        a: "Del 1 de julio del año anterior al 30 de junio del año en que se paga.",
      },
      {
        q: "¿Cómo se cuentan los días?",
        a: "Con meses comerciales de 30 días (año de 360), igual que en los cálculos laborales y en nuestras plantillas.",
      },
    ],
  },
  {
    slug: "aguinaldo",
    name: "Aguinaldo (décimo tercer mes)",
    title: "Calculadora de aguinaldo en Honduras",
    seoTitle: "Calculadora de aguinaldo Honduras 2026 (décimo tercer mes)",
    description:
      "Calcula tu aguinaldo o décimo tercer mes en Honduras: completo o proporcional por fecha de ingreso o de salida. Gratis y al instante.",
    keywords: [
      "calculadora aguinaldo Honduras",
      "calcular aguinaldo",
      "décimo tercer mes calculadora",
      "aguinaldo proporcional",
    ],
    intro:
      "Calcula el aguinaldo que te corresponde entre el 1 de enero y el 31 de diciembre (o tu fecha de salida).",
    template: "decimo-tercer-y-cuarto-mes",
    guide: "como-calcular-aguinaldo-decimo-tercer-mes-honduras",
    regulated: true,
    faq: [
      {
        q: "¿Cuándo se paga el aguinaldo?",
        a: "En diciembre. Si sales antes, se paga la parte proporcional en tu liquidación.",
      },
      {
        q: "¿El aguinaldo tiene deducciones de IHSS?",
        a: "No se le descuentan cuotas de IHSS ni RAP.",
      },
    ],
  },
  {
    slug: "prestaciones-laborales",
    name: "Prestaciones laborales",
    title: "Calculadora de prestaciones laborales en Honduras",
    seoTitle: "Calculadora de prestaciones laborales Honduras 2026",
    description:
      "Calcula tus prestaciones en Honduras: preaviso, auxilio de cesantía, vacaciones y décimos proporcionales según el motivo de salida. Resultado detallado y gratis.",
    keywords: [
      "calculadora de prestaciones Honduras",
      "calcular prestaciones laborales",
      "calculadora cesantía Honduras",
      "liquidación laboral calculadora",
    ],
    intro:
      "Escribe tus fechas, salarios y el motivo de salida: verás el detalle de preaviso, cesantía, vacaciones y décimos.",
    template: "prestaciones-laborales",
    guide: "como-calcular-prestaciones-laborales-honduras",
    regulated: true,
    faq: [
      {
        q: "¿Qué salario promedio debo poner?",
        a: "El promedio de lo que ganaste en los últimos seis meses, incluyendo horas extra y comisiones. Se usa para preaviso y cesantía.",
      },
      {
        q: "¿Si renuncio me corresponde algo?",
        a: "Normalmente vacaciones pendientes y proporcionales y la parte proporcional de los décimos, pero no preaviso ni cesantía.",
      },
    ],
  },
  {
    slug: "isr",
    name: "ISR (impuesto sobre la renta)",
    title: "Calculadora de ISR para asalariados en Honduras",
    seoTitle: "Calculadora ISR Honduras 2026: impuesto sobre la renta",
    description:
      "Calcula el Impuesto Sobre la Renta en Honduras con la tabla progresiva 2026: ISR anual, desglose por tramo y retención mensual estimada.",
    keywords: [
      "calculadora ISR Honduras",
      "calcular impuesto sobre la renta",
      "ISR asalariados Honduras",
      "retención ISR mensual",
    ],
    intro:
      "Escribe tu salario mensual y verás el ISR anual estimado tramo por tramo y la retención mensual aproximada.",
    template: "isr-personas-naturales",
    guide: "como-calcular-isr-honduras-personas-naturales",
    regulated: true,
    faq: [
      {
        q: "¿Incluye el aguinaldo y el décimo cuarto?",
        a: "Esta calculadora usa 12 salarios para estimar. Si quieres incluir otros ingresos o deducciones, usa la plantilla de ISR o consulta a tu contador.",
      },
      {
        q: "¿Qué es la renta neta gravable?",
        a: "Tus ingresos del año menos las deducciones permitidas. Sobre ese monto se aplica la tabla progresiva.",
      },
    ],
  },
  {
    slug: "horas-extra",
    name: "Horas extra",
    title: "Calculadora de horas extra en Honduras",
    seoTitle: "Calculadora de horas extra Honduras (diurnas y nocturnas)",
    description:
      "Calcula el pago de tus horas extra en Honduras: valor de la hora ordinaria según tu jornada y recargos por hora extra diurna, nocturna y prolongación nocturna.",
    keywords: [
      "calculadora horas extra Honduras",
      "calcular horas extras",
      "valor hora extra nocturna",
      "pago horas extra",
    ],
    intro:
      "Escribe tu salario, tu jornada y las horas extra trabajadas para saber cuánto deben pagarte.",
    template: "horas-extra",
    guide: "como-calcular-horas-extra-honduras",
    regulated: true,
    faq: [
      {
        q: "¿Cómo se calcula la hora ordinaria?",
        a: "Salario mensual ÷ 30 ÷ horas de tu jornada diaria.",
      },
      {
        q: "¿Las horas extra se suman al salario para prestaciones?",
        a: "Sí, forman parte del salario promedio de los últimos seis meses.",
      },
    ],
  },
  {
    slug: "isv",
    name: "ISV 15 % y 18 %",
    title: "Calculadora de ISV en Honduras (15 % y 18 %)",
    seoTitle: "Calculadora de ISV Honduras: agregar o sacar el 15 %",
    description:
      "Calcula el ISV en Honduras: agrega el 15 % o 18 % a un precio o saca el impuesto de un precio con ISV incluido. Subtotal, impuesto y total al instante.",
    keywords: [
      "calculadora ISV Honduras",
      "calcular ISV 15%",
      "sacar ISV de un precio",
      "cómo calcular el impuesto sobre ventas",
    ],
    intro: "Agrega el ISV a un precio sin impuesto o descompón un precio que ya lo incluye.",
    template: "factura-con-isv",
    guide: "como-hacer-factura-excel-honduras-sar",
    regulated: true,
    faq: [
      {
        q: "¿Cómo saco el ISV de un precio que ya lo incluye?",
        a: "Divide el precio entre 1.15 para obtener el subtotal; la diferencia es el ISV. Con 18 %, divide entre 1.18.",
      },
      {
        q: "¿Qué productos pagan 18 %?",
        a: "Según la tabla de reglas del sitio: bebidas alcohólicas, cigarrillos y boletos aéreos en clase ejecutiva. Verifica la lista vigente con el SAR.",
      },
    ],
  },
  {
    slug: "cuota-de-prestamo",
    name: "Cuota de préstamo",
    title: "Calculadora de cuota de préstamo en lempiras",
    seoTitle: "Calculadora de préstamos: cuota mensual e intereses",
    description:
      "Calcula la cuota mensual de un préstamo personal, de carro o de vivienda: intereses totales y tabla de amortización, igual que la fórmula PAGO de Excel.",
    keywords: [
      "calculadora de préstamos",
      "calcular cuota préstamo",
      "simulador de préstamo Honduras",
      "tabla de amortización",
    ],
    intro:
      "Escribe el monto, la tasa anual y el plazo: verás tu cuota, los intereses totales y cómo baja el saldo.",
    template: "simulador-de-prestamos",
    guide: "como-calcular-cuota-prestamo-excel",
    regulated: false,
    faq: [
      {
        q: "¿La cuota incluye seguros?",
        a: "No. Calcula capital e intereses; los bancos suelen sumar seguros y comisiones.",
      },
      {
        q: "¿Qué tasa debo poner?",
        a: "La tasa nominal anual que te ofrece el banco o la cooperativa.",
      },
    ],
  },
];

export function getCalculator(slug: string): CalculatorMeta | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}

export function calculatorPath(slug: string, country = "hn"): string {
  return `/${country}/calculadoras/${slug}`;
}

/** Calculadoras relacionadas con una plantilla o una guía. */
export function calculatorsFor(opts: { template?: string; guide?: string }): CalculatorMeta[] {
  return CALCULATORS.filter(
    (c) =>
      (opts.template && c.template === opts.template) || (opts.guide && c.guide === opts.guide),
  );
}
