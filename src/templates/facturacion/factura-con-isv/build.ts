import { addCommercialDocument } from "@/lib/excel/document";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import type { TemplateBuild } from "@/templates/types";

import type { FacturaConfig } from "./form";

export const build: TemplateBuild<FacturaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: `Factura — ${config.businessName || "Mi negocio"}`,
    description: "Factura con ISV generada con Excel Codezun",
    ctx,
    options,
  });
  const rate = (id: string) => ctx.taxes.salesTax.rates.find((r) => r.id === id)?.label ?? "";

  const doc = addCommercialDocument(wb, {
    sheetName: "Factura",
    title: "FACTURA",
    business: {
      name: config.businessName,
      taxId: config.taxId,
      address: config.address,
      phone: config.phone,
      email: config.email,
      logo: config.logo,
    },
    theme,
    ctx,
    numbering: {
      prefix: config.prefix,
      start: config.startNumber,
      digits: ctx.invoicing.correlativeDigits,
    },
    fiscal: {
      cai: config.cai,
      rangeFrom: config.rangeFrom,
      rangeTo: config.rangeTo,
      deadline: config.deadline || null,
      legends: ctx.invoicing.legends,
    },
    counterpartyLabel: "Cliente",
    lines: config.lines,
    columns: {
      code: config.optionalColumns.includes("code"),
      discount: config.optionalColumns.includes("discount"),
      unit: config.optionalColumns.includes("unit"),
    },
    tax: { enabled: true, defaultRateId: config.defaultRate },
    paymentMethods: config.paymentMethods.length ? config.paymentMethods : ["Efectivo"],
    showPaymentTerms: true,
    amountInWords: config.amountInWords,
    exemptionFields: config.exemptionFields ? ctx.invoicing.exemptionFields : [],
    notes: config.notes,
    paper: config.paper,
    example: config.example
      ? [
          {
            code: "P-001",
            desc: "Camisa polo bordada",
            unit: "Unidad",
            qty: 2,
            price: 350,
            disc: 20,
            rate: rate("standard"),
          },
          {
            code: "B-014",
            desc: "Cerveza nacional (caja de 12)",
            unit: "Caja",
            qty: 1,
            price: 520,
            disc: 0,
            rate: rate("special"),
          },
          {
            code: "L-220",
            desc: "Libro escolar",
            unit: "Unidad",
            qty: 3,
            price: 180,
            disc: 0,
            rate: rate("exempt"),
          },
        ]
      : undefined,
  });

  await protectSheet(doc.ws);

  addInstructionsSheet(wb, {
    title: "Factura con ISV",
    description:
      "Formato de factura con fórmulas para calcular subtotales, ISV por tasa y total. Cumple con los datos que suele exigir el régimen de facturación del SAR; verifica los requisitos vigentes con tu contador.",
    steps: [
      "Completa en la hoja Parámetros el prefijo, el CAI, el rango autorizado y la fecha límite de emisión. Se reflejan solos en la factura.",
      "En la hoja Factura escribe la fecha, el correlativo y los datos del cliente.",
      "Agrega cada producto o servicio con su descripción, cantidad y precio unitario. Elige el tipo de ISV de cada línea en la lista desplegable.",
      "Los subtotales, el ISV por tasa, el total y el total en letras se calculan automáticamente.",
      "Para una factura nueva, guarda una copia del archivo y aumenta el correlativo en 1.",
    ],
    sheets: [
      { name: "Factura", description: "El documento para imprimir o exportar a PDF." },
      {
        name: "Parámetros",
        description: "Datos de facturación SAR y tasas de ISV usadas en las fórmulas.",
      },
      {
        name: "Listas",
        description: "Opciones de las listas desplegables (formas de pago, condición).",
      },
    ],
    tips: [
      "Si el correlativo queda fuera del rango autorizado o la fecha supera la fecha límite de emisión, la celda se marca en rojo.",
      "Las líneas con cantidad pero sin descripción se marcan en ámbar.",
      "Para guardar en PDF: Archivo → Exportar → PDF (Excel) o Archivo → Descargar → PDF (Google Sheets).",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });

  setActiveSheet(wb, 0);
  return wb;
};
