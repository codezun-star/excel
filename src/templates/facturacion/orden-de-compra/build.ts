import { addCommercialDocument } from "@/lib/excel/document";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { columnsFrom, exampleLines } from "@/templates/shared/document-form";
import type { TemplateBuild } from "@/templates/types";

import type { OrdenCompraConfig } from "./form";

export const build: TemplateBuild<OrdenCompraConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: `Orden de compra — ${config.businessName || "Mi negocio"}`,
    ctx,
    options,
  });
  const doc = addCommercialDocument(wb, {
    sheetName: "Orden de compra",
    title: "ORDEN DE COMPRA",
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
    counterpartyLabel: "Proveedor",
    extraFields: [
      { key: "deliveryDate", label: "Fecha de entrega", kind: "date" },
      {
        key: "deliveryPlace",
        label: "Lugar de entrega",
        kind: "text",
        value: config.deliveryPlace || null,
      },
    ],
    lines: config.lines,
    columns: columnsFrom(config.optionalColumns),
    tax: { enabled: config.includeTax, defaultRateId: config.defaultRate },
    paymentMethods: config.paymentMethods.length ? config.paymentMethods : ["Transferencia"],
    showPaymentTerms: true,
    amountInWords: config.amountInWords,
    notes: config.notes,
    signatures: ["Solicitado por", "Autorizado por", "Recibido por el proveedor"],
    paper: config.paper,
    example: config.example ? exampleLines(ctx) : undefined,
  });
  await protectSheet(doc.ws);

  addInstructionsSheet(wb, {
    title: "Orden de compra",
    description:
      "Formaliza tus compras a proveedores con número, montos, condiciones y firmas de autorización.",
    steps: [
      "Escribe la fecha, los datos del proveedor y la fecha de entrega.",
      "Agrega los productos solicitados con cantidad y precio pactado.",
      "Revisa el total (y el ISV si aplica) y obtén las firmas de autorización.",
      "Envía la orden al proveedor y guarda una copia con el siguiente correlativo para la próxima.",
    ],
    sheets: [
      { name: "Orden de compra", description: "El documento para imprimir o enviar." },
      { name: "Parámetros", description: "Prefijo de numeración y tasas de ISV." },
      { name: "Listas", description: "Formas de pago y condiciones." },
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
