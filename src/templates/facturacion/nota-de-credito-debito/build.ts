import "server-only";

import { addCommercialDocument } from "@/lib/excel/document";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { columnsFrom, exampleLines } from "@/templates/shared/document-form";
import type { TemplateBuild } from "@/templates/types";

import type { NotaConfig } from "./form";

export const build: TemplateBuild<NotaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const isCredit = config.noteType === "credito";
  const label = isCredit ? "Nota de crédito" : "Nota de débito";
  const wb = createWorkbook({
    title: `${label} — ${config.businessName || "Mi negocio"}`,
    ctx,
    options,
  });
  const doc = addCommercialDocument(wb, {
    sheetName: label,
    title: label.toUpperCase(),
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
    extraFields: [
      { key: "invoice", label: "Factura que modifica", kind: "text" },
      { key: "invoiceDate", label: "Fecha de la factura", kind: "date" },
      {
        key: "reason",
        label: "Motivo",
        kind: "text",
        value: isCredit ? "Devolución" : "Cargo adicional",
      },
    ],
    lines: config.lines,
    columns: columnsFrom(config.optionalColumns),
    tax: { enabled: true, defaultRateId: config.defaultRate },
    paymentMethods: config.paymentMethods.length ? config.paymentMethods : ["Efectivo"],
    showPaymentTerms: false,
    amountInWords: config.amountInWords,
    notes: config.notes,
    paper: config.paper,
    example: config.example ? exampleLines(ctx).slice(0, 1) : undefined,
  });
  await protectSheet(doc.ws);

  addInstructionsSheet(wb, {
    title: label,
    description: isCredit
      ? "Documento para disminuir el valor de una factura emitida (devoluciones, descuentos o anulaciones parciales)."
      : "Documento para aumentar el valor de una factura emitida (intereses, cargos o ajustes).",
    steps: [
      "Completa en Parámetros el CAI, el rango autorizado y la fecha límite de emisión de las notas.",
      "Escribe la fecha, el cliente, el número y la fecha de la factura que modifica y el motivo.",
      "Agrega las líneas afectadas con cantidad, precio y tipo de ISV.",
      "El ISV por tasa, el total y el total en letras se calculan automáticamente.",
    ],
    sheets: [
      { name: label, description: "El documento para imprimir." },
      { name: "Parámetros", description: "Datos de autorización SAR y tasas de ISV." },
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
