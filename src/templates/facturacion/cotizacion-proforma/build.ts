import { addCommercialDocument } from "@/lib/excel/document";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { columnsFrom, exampleLines } from "@/templates/shared/document-form";
import type { TemplateBuild } from "@/templates/types";

import type { CotizacionConfig } from "./form";

export const build: TemplateBuild<CotizacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const isProforma = config.documentTitle === "FACTURA PROFORMA";
  const label = isProforma ? "Factura proforma" : "Cotización";
  const wb = createWorkbook({
    title: `${label} — ${config.businessName || "Mi negocio"}`,
    ctx,
    options,
  });

  const doc = addCommercialDocument(wb, {
    sheetName: label,
    title: config.documentTitle,
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
    numbering: { prefix: config.prefix, start: config.startNumber, digits: 5 },
    counterpartyLabel: "Cliente",
    extraParams: [
      { key: "validity", label: "Días de vigencia", value: config.validityDays, kind: "integer" },
    ],
    extraFields: [
      {
        key: "valid",
        label: "Válida hasta",
        kind: "date",
        formula: ({ date, param }) => `IF(${date}="","",${date}+${param("validity")})`,
      },
      { key: "delivery", label: "Entrega", kind: "text", value: config.deliveryTime || null },
    ],
    lines: config.lines,
    columns: columnsFrom(config.optionalColumns),
    tax: { enabled: config.includeTax, defaultRateId: config.defaultRate },
    paymentMethods: config.paymentMethods.length ? config.paymentMethods : ["Efectivo"],
    showPaymentTerms: true,
    amountInWords: config.amountInWords,
    notes: config.notes,
    terms: config.terms,
    signatures: ["Elaborado por", "Aceptado por el cliente (nombre y firma)"],
    paper: config.paper,
    example: config.example ? exampleLines(ctx) : undefined,
  });
  await protectSheet(doc.ws);

  addInstructionsSheet(wb, {
    title: label,
    description:
      "Documento para presentar precios a tus clientes antes de la venta. No es un documento fiscal: al concretar la venta emite tu factura autorizada.",
    steps: [
      `Escribe la fecha y los datos del cliente en la hoja ${label}. La fecha de vigencia se calcula sola.`,
      "Agrega los productos o servicios con cantidad y precio unitario.",
      config.includeTax
        ? "Elige el tipo de ISV de cada línea; el desglose y el total se calculan automáticamente."
        : "El total se calcula automáticamente.",
      "Revisa las condiciones comerciales al pie y ajústalas si hace falta.",
      "Para una nueva cotización, guarda una copia del archivo y aumenta el correlativo.",
    ],
    sheets: [
      { name: label, description: "El documento para imprimir o enviar en PDF." },
      { name: "Parámetros", description: "Prefijo, días de vigencia y tasas de ISV." },
      { name: "Listas", description: "Formas de pago y condiciones para las listas desplegables." },
    ],
    ctx,
    theme,
    options,
  });

  setActiveSheet(wb, 0);
  return wb;
};
