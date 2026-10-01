import { amountInWordsRef } from "@/lib/excel/amount-in-words";
import { addFields } from "@/lib/excel/blocks";
import { fitWithin, parseImageDataUrl } from "@/lib/excel/image";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { font, makeTheme, styleNote, styleTitle } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { EstadoCuentaConfig } from "./form";

export const build: TemplateBuild<EstadoCuentaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Estado de cuenta", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Estado de cuenta", {
    paper: config.paper,
    showGridLines: false,
    tabColor: theme.primary,
  });
  [12, 18, 34, 15, 15, 16].forEach((w, i) => (ws.getColumn(i + 1).width = w));

  // Encabezado
  const logo = parseImageDataUrl(config.logo);
  const textCol = logo ? 3 : 1;
  if (logo) {
    const size = fitWithin(logo.width, logo.height, 200, 80);
    const id = wb.addImage({ base64: logo.base64, extension: logo.extension });
    ws.addImage(id, { tl: { col: 0.1, row: 0.1 }, ext: size, editAs: "oneCell" });
  }
  const lines = [
    config.businessName || "Nombre de tu negocio",
    config.taxId ? `${ctx.taxId.name}: ${config.taxId}` : "",
    [config.address, config.phone, config.email].filter(Boolean).join(" · "),
  ];
  lines.forEach((text, i) => {
    ws.mergeCells(i + 1, textCol, i + 1, 4);
    const c = ws.getCell(i + 1, textCol);
    c.value = text || null;
    if (i === 0) styleTitle(c, theme, 16);
    else c.font = font(theme, { size: 10, color: theme.muted });
  });
  ws.mergeCells(1, 5, 1, 6);
  const title = ws.getCell(1, 5);
  title.value = "ESTADO DE CUENTA";
  title.font = font(theme, { bold: true, size: 14, color: theme.primaryDark });
  title.alignment = { horizontal: "right" };

  const client = addFields(ws, {
    startRow: 5,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 2,
    fields: [
      { key: "client", label: "Cliente", kind: "text" },
      { key: "taxId", label: ctx.taxId.name, kind: "text" },
      { key: "from", label: "Período del", kind: "date" },
      { key: "to", label: "al", kind: "date" },
    ],
    theme,
    ctx,
  });
  const opening = addFields(ws, {
    startRow: 5,
    labelCol: 5,
    valueCol: 6,
    fields: [
      {
        key: "opening",
        label: "Saldo inicial",
        kind: "currency",
        value: config.example ? 2500 : 0,
      },
    ],
    theme,
    ctx,
  });
  void client;

  const table = addTable(ws, {
    startRow: 10,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "doc", header: "Documento", kind: "text", width: 18 },
      { key: "concept", header: "Concepto", kind: "text", width: 34 },
      { key: "charge", header: "Cargos", kind: "currency", width: 15, total: "sum" },
      { key: "payment", header: "Abonos", kind: "currency", width: 15, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        formula: (r) =>
          `IF(AND(${r.c("charge")}="",${r.c("payment")}=""),"",${opening.cell("opening")}+SUM(${r.upTo("charge")})-SUM(${r.upTo("payment")}))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales del período" },
    example: config.example
      ? [
          { date: "2026-03-02", doc: "F-0101", concept: "Compra de mercadería", charge: 3200 },
          { date: "2026-03-10", doc: "R-0045", concept: "Abono en efectivo", payment: 2000 },
          { date: "2026-03-18", doc: "F-0115", concept: "Compra de mercadería", charge: 1450 },
          { date: "2026-03-28", doc: "R-0051", concept: "Transferencia", payment: 2500 },
        ]
      : undefined,
  });

  const totalRow = table.totalRow ?? table.lastRow;
  const result = addFields(ws, {
    startRow: totalRow + 2,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "final",
        label: "SALDO FINAL",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () =>
          `${opening.cell("opening")}+${table.total("charge")}-${table.total("payment")}`,
      },
    ],
    theme,
    ctx,
  });
  let row = result.nextRow + 1;
  if (config.amountInWords) {
    const words = amountInWordsRef(wb, sheetRef(ws.name, result.cell("final")), ctx);
    ws.mergeCells(row, 1, row, 6);
    const c = ws.getCell(row, 1);
    c.value = { formula: `"Saldo: "&${words}` };
    c.font = font(theme, { bold: true, size: 10 });
    row += 2;
  }
  if (config.notes) {
    ws.mergeCells(row, 1, row, 6);
    const n = ws.getCell(row, 1);
    n.value = config.notes;
    styleNote(n, theme);
  }
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Estado de cuenta de cliente",
    description: "Muestra a tus clientes cuánto deben, qué compraron y qué pagaron en un período.",
    steps: [
      "Escribe los datos del cliente, el período y el saldo inicial (lo que debía al empezar el período).",
      "Registra cada factura en la columna Cargos y cada pago en la columna Abonos.",
      "El saldo acumulado y el saldo final se calculan solos.",
      "Exporta la hoja a PDF y envíala a tu cliente.",
    ],
    tips: [
      "Para varios clientes, duplica la hoja (clic derecho en la pestaña → Mover o copiar → Crear una copia).",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
