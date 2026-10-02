import { fmtL, pct, round2, salesTaxRate } from "../calc";
import type { Article } from "../types";

export const factura: Article = {
  slug: "como-hacer-factura-excel-honduras-sar",
  title: "Cómo hacer una factura en Excel en Honduras: requisitos del SAR, CAI e ISV",
  seoTitle: "Factura en Excel Honduras: requisitos SAR, CAI e ISV",
  description:
    "Qué debe llevar una factura en Honduras según el SAR (CAI, rango autorizado, RTN), cómo calcular el ISV del 15 % y 18 % y plantilla de factura en Excel.",
  excerpt:
    "Los datos obligatorios de una factura hondureña, cómo separar gravado, exento e ISV, y cómo numerar tus correlativos.",
  keywords: [
    "factura en Excel Honduras",
    "requisitos factura SAR",
    "factura con CAI",
    "formato de factura Honduras",
    "calcular ISV 15%",
    "plantilla factura Honduras",
  ],
  category: "facturacion",
  publishedAt: "2026-10-02",
  updatedAt: "2026-10-02",
  templates: [
    "factura-con-isv",
    "cotizacion-proforma",
    "recibo-de-pago",
    "libro-de-ventas-y-compras",
  ],
  regulated: true,
  faq: [
    {
      q: "¿Puedo hacer mis facturas en Excel en Honduras?",
      a: "Excel te sirve para preparar, calcular y controlar tus facturas y cotizaciones. Para que una factura sea válida fiscalmente debe emitirse con un CAI y un rango de numeración autorizados por el SAR bajo la modalidad que te autorizaron (imprenta, autoimpresor o factura electrónica). Consulta tu modalidad con el SAR o tu contador.",
    },
    {
      q: "¿Qué es el CAI?",
      a: "Es el Código de Autorización de Impresión que el SAR asigna a un rango de documentos fiscales. Debe aparecer en cada factura junto con el rango autorizado y la fecha límite de emisión.",
    },
    {
      q: "¿Cómo se calcula el ISV en una factura?",
      a: "Separa los montos gravados al 15 %, gravados al 18 % y exentos. El ISV es la suma de cada base gravada por su tasa. El total es la suma de todas las bases más el ISV.",
    },
    {
      q: "¿Qué pasa si se vence la fecha límite de emisión?",
      a: "No puedes seguir emitiendo con ese rango. Debes solicitar un nuevo rango y CAI antes de la fecha límite.",
    },
  ],
  body: (ctx) => {
    const r15 = salesTaxRate(ctx, "standard");
    const r18 = salesTaxRate(ctx, "special");
    const g15 = 1000;
    const g18 = 200;
    const ex = 300;
    const isv15 = round2(g15 * r15);
    const isv18 = round2(g18 * r18);
    const total = round2(g15 + g18 + ex + isv15 + isv18);
    return [
      {
        type: "p",
        text: "Una factura en Honduras no es solo un documento de cobro: es un **documento fiscal** regulado por el SAR. Si vendes bienes o servicios gravados, tus facturas deben cumplir requisitos de forma y calcular correctamente el ISV. Esta guía resume lo que debe llevar y cómo armar tu formato en Excel.",
      },
      { type: "h2", id: "requisitos", text: "Datos que debe llevar una factura" },
      {
        type: "ul",
        items: [
          "Nombre o razón social, **RTN**, dirección y teléfono del emisor.",
          `Número de documento con el formato **${ctx.invoicing.numberFormatHint}**.`,
          `**${ctx.invoicing.authorizationCodeName}** (${ctx.invoicing.authorizationCodeDescription.toLowerCase()}).`,
          "**Rango autorizado** (del número inicial al final) y **fecha límite de emisión**.",
          "Fecha de emisión, nombre y RTN del cliente (cuando aplique).",
          "Detalle de productos o servicios con cantidad, precio unitario y total.",
          "Subtotales separados: importe exento, exonerado, gravado 15 %, gravado 18 %, ISV y total.",
          "Total en letras y la leyenda de original y copia.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Validez fiscal",
        text: "La factura solo es válida si se emite dentro de un rango y CAI autorizados por el SAR, en la modalidad que te autorizaron. Excel te ayuda a calcular, numerar y controlar; confirma tu modalidad con tu contador.",
      },
      { type: "h2", id: "isv", text: "Cómo calcular el ISV" },
      {
        type: "table",
        head: ["Tipo", "Tasa", "Aplica a"],
        rows: ctx.taxes.salesTax.rates.map((r) => [r.label, pct(r.rate), r.description]),
      },
      {
        type: "example",
        title: "Ejemplo de factura con bases separadas",
        rows: [
          ["Importe exento", fmtL(ex)],
          [`Importe gravado ${pct(r15)}`, fmtL(g15)],
          [`Importe gravado ${pct(r18)}`, fmtL(g18)],
          [`ISV ${pct(r15)}`, fmtL(isv15)],
          [`ISV ${pct(r18)}`, fmtL(isv18)],
        ],
        total: ["Total a pagar", fmtL(total)],
      },
      { type: "h2", id: "formulas", text: "Fórmulas útiles en Excel" },
      {
        type: "formula",
        formula: `=SUMAR.SI(E10:E30,"15%",F10:F30)*${r15}`,
        caption:
          "ISV del 15 %: suma los totales de las líneas marcadas «15%» y multiplica por la tasa.",
      },
      {
        type: "formula",
        formula: '="000-001-01-"&TEXTO(B3,"00000000")',
        caption:
          "Arma el número de factura con su correlativo de 8 dígitos a partir del número en B3.",
      },
      {
        type: "cta",
        template: "factura-con-isv",
        title: "Plantilla de factura con ISV para Honduras",
        text: "Tu RTN, CAI, rango autorizado y fecha límite; ISV 15 % y 18 % por línea, importes exentos y total en letras, lista para imprimir.",
      },
      { type: "h2", id: "control", text: "Controla tus ventas para declarar" },
      {
        type: "p",
        text: "Cada factura que emites alimenta tu [declaración mensual del ISV](/blog/declaracion-mensual-isv-honduras). Registra tus ventas y compras en un libro para que cuadren tus débitos y créditos fiscales. Para presupuestos antes de facturar, usa una [cotización o proforma](/plantillas/cotizacion-proforma).",
      },
    ];
  },
};
