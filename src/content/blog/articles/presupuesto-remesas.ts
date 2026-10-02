import type { Article } from "../types";

export const presupuestoRemesas: Article = {
  slug: "presupuesto-familiar-excel-remesas",
  title: "Presupuesto familiar en Excel: cómo administrar la remesa y que alcance el mes",
  seoTitle: "Presupuesto familiar en Excel: administra tu remesa",
  description:
    "Arma un presupuesto familiar en Excel para administrar remesas y salario: categorías, regla 50/30/20 adaptada, ahorro y control de gastos en lempiras.",
  excerpt:
    "Un método simple para repartir la remesa y el salario, ahorrar algo cada mes y saber en qué se va el dinero.",
  keywords: [
    "presupuesto familiar Excel",
    "administrar remesas",
    "control de gastos Excel",
    "presupuesto mensual Honduras",
    "cómo ahorrar en Honduras",
  ],
  category: "finanzas",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["presupuesto-mensual", "control-de-remesas", "gastos-e-ingresos"],
  faq: [
    {
      q: "¿Qué porcentaje de la remesa debería ahorrar?",
      a: "Empieza con lo que puedas sostener, aunque sea un 5 %. Lo importante es apartarlo apenas llega el dinero, no con lo que sobra a fin de mes.",
    },
    {
      q: "¿Cómo registro remesas que llegan en dólares?",
      a: "Anota el monto en dólares, el tipo de cambio que te dieron y el monto recibido en lempiras. Así puedes comparar remesadoras y ver cuánto pierdes en comisiones.",
    },
  ],
  body: () => [
    {
      type: "p",
      text: "Para miles de familias hondureñas la remesa es el ingreso principal del mes. Que alcance depende menos del monto y más de tener un plan: saber cuánto entra, cuánto sale y qué se aparta primero. Un presupuesto en Excel te lo deja claro en una sola hoja.",
    },
    { type: "h2", id: "metodo", text: "Un método simple en 4 pasos" },
    {
      type: "steps",
      items: [
        {
          title: "Suma todo lo que entra",
          text: "Remesas (en lempiras recibidos), salarios, ventas o cualquier otro ingreso del mes.",
        },
        {
          title: "Aparta primero lo fijo y el ahorro",
          text: "Alquiler, luz, agua, colegiaturas, cuotas de préstamos y un monto para ahorro o emergencias.",
        },
        {
          title: "Reparte el resto en categorías",
          text: "Comida, transporte, salud, teléfono, ropa y gustos. Ponle un tope a cada una.",
        },
        {
          title: "Anota lo que gastas y compara",
          text: "Al final del mes compara lo planeado con lo real y ajusta el siguiente mes.",
        },
      ],
    },
    { type: "h2", id: "regla", text: "La regla 50/30/20 adaptada" },
    {
      type: "table",
      head: ["Destino", "Porcentaje sugerido", "Ejemplo con L 20,000"],
      rows: [
        [
          "Necesidades (vivienda, comida, servicios, transporte)",
          "50 % a 60 %",
          "L 10,000 a L 12,000",
        ],
        ["Deudas y ahorro", "20 % a 30 %", "L 4,000 a L 6,000"],
        ["Gustos y extras", "10 % a 20 %", "L 2,000 a L 4,000"],
      ],
      caption: "Es una guía, no una regla fija: ajústala a tu realidad.",
    },
    {
      type: "cta",
      template: "presupuesto-mensual",
      title: "Presupuesto mensual en Excel",
      text: "Ingresos, gasto real por categoría, diferencia contra lo planeado, porcentaje usado y ahorro del mes.",
    },
    { type: "h2", id: "remesas", text: "Lleva el control de cada remesa" },
    {
      type: "p",
      text: "Anotar fecha, remitente, remesadora, monto en dólares, tipo de cambio y comisión te ayuda a elegir la opción que más te deja en lempiras y a saber cuánto recibiste en el año.",
    },
    {
      type: "cta",
      template: "control-de-remesas",
      title: "Control de remesas",
      text: "Cada envío con su tipo de cambio, comisión, lo recibido en lempiras y en qué se usó.",
    },
    {
      type: "callout",
      tone: "tip",
      text: "¿Piensas pedir un préstamo para construir o emprender? Primero calcula la cuota con la [fórmula PAGO](/blog/como-calcular-cuota-prestamo-excel) y verifica que quepa en tu presupuesto.",
    },
  ],
};
