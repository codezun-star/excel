import { fmtL, pct, round2, salesTaxRate } from "../calc";
import type { Article } from "../types";

export const isvMensual: Article = {
  slug: "declaracion-mensual-isv-honduras",
  title: "Declaración mensual del ISV en Honduras: cómo calcular débito y crédito fiscal",
  seoTitle: "Declaración mensual del ISV en Honduras: guía práctica",
  description:
    "Cómo preparar la declaración mensual del ISV en Honduras: débito fiscal, crédito fiscal, saldo a pagar o a favor, fecha límite y plantilla en Excel.",
  excerpt:
    "Débito menos crédito fiscal, qué compras te dan derecho a crédito, cuándo vence y cómo dejar el cálculo listo cada mes.",
  keywords: [
    "declaración ISV Honduras",
    "declaración mensual ISV",
    "débito y crédito fiscal",
    "formulario 222 SAR",
    "cómo declarar ISV",
    "ISV a pagar Honduras",
  ],
  category: "impuestos",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: ["declaracion-mensual-isv", "libro-de-ventas-y-compras", "calendario-tributario"],
  regulated: true,
  faq: [
    {
      q: "¿Hasta cuándo se presenta la declaración del ISV?",
      a: "Según el módulo de reglas del sitio, a más tardar el día 10 del mes siguiente. Confirma la fecha vigente y los días inhábiles en el calendario del SAR.",
    },
    {
      q: "¿Qué pasa si mi crédito fiscal es mayor que mi débito?",
      a: "Queda un saldo a favor que puedes trasladar al mes siguiente para compensarlo con futuros débitos.",
    },
    {
      q: "¿Debo declarar aunque no haya vendido nada?",
      a: "Sí. Si estás inscrito como obligado del ISV debes presentar la declaración aunque sea en cero.",
    },
  ],
  body: (ctx) => {
    const tax = ctx.taxes.salesTax;
    const r = salesTaxRate(ctx, "standard");
    const sales = 100000;
    const purchases = 60000;
    const debit = round2(sales * r);
    const credit = round2(purchases * r);
    return [
      {
        type: "p",
        text: `Si estás inscrito en el ${tax.longName} (${tax.name}), cada mes debes presentar la **${tax.filingFormName}** a más tardar el **día ${tax.filingDueDay} del mes siguiente**. La lógica es sencilla: pagas el ISV que cobraste en tus ventas menos el ISV que pagaste en tus compras.`,
      },
      { type: "h2", id: "conceptos", text: "Débito fiscal y crédito fiscal" },
      {
        type: "ul",
        items: [
          "**Débito fiscal**: el ISV que cobraste en tus facturas de venta del mes.",
          "**Crédito fiscal**: el ISV que pagaste en compras y gastos del negocio respaldados con factura a tu nombre y RTN.",
          "**ISV a pagar** = débito fiscal − crédito fiscal (− saldo a favor del mes anterior).",
        ],
      },
      {
        type: "example",
        title: `Ejemplo del mes con tasa de ${pct(r)}`,
        rows: [
          ["Ventas gravadas", fmtL(sales)],
          [`Débito fiscal (${pct(r)})`, fmtL(debit)],
          ["Compras gravadas", fmtL(purchases)],
          [`Crédito fiscal (${pct(r)})`, `− ${fmtL(credit)}`],
        ],
        total: ["ISV a pagar", fmtL(round2(debit - credit))],
      },
      { type: "h2", id: "paso-a-paso", text: "Cómo prepararla cada mes" },
      {
        type: "steps",
        items: [
          {
            title: "Cierra tu libro de ventas",
            text: "Suma por tasa (15 %, 18 %) y separa ventas exentas y exoneradas.",
          },
          {
            title: "Cierra tu libro de compras",
            text: "Solo cuentan las facturas con tu RTN y los requisitos fiscales. Separa compras gravadas y exentas.",
          },
          {
            title: "Calcula el saldo",
            text: "Débito menos crédito menos el saldo a favor del mes anterior.",
          },
          {
            title: "Presenta y paga antes de la fecha límite",
            text: "Presenta en la plataforma del SAR y paga en el banco autorizado. Guarda el acuse.",
          },
        ],
      },
      {
        type: "cta",
        template: "declaracion-mensual-isv",
        title: "Prepara tu declaración del ISV en Excel",
        text: "Calcula débito y crédito fiscal, aplica saldos a favor y retenciones y obtiene el ISV a pagar del mes.",
      },
      {
        type: "callout",
        tone: "tip",
        text: "Registra cada factura el mismo día con el [libro de ventas y compras](/hn/plantillas/libro-de-ventas-y-compras) y no olvides las fechas con el [calendario tributario](/hn/plantillas/calendario-tributario). Si emites facturas, revisa [qué debe llevar una factura en Honduras](/blog/como-hacer-factura-excel-honduras-sar).",
      },
    ];
  },
};
