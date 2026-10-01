import { amountInWordsRef } from "@/lib/excel/amount-in-words";
import { FMT, currencyFormat } from "@/lib/excel/formats";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addParametersSheet } from "@/lib/excel/params";
import { absAddr, formulaString, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  solidFill,
  styleCalc,
  styleInput,
  styleLabel,
  toArgb,
} from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { dateValidation, decimalMin, listFromRange } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ReciboConfig } from "./form";

const BLOCK = 11;
const PER_PAGE = 3;

export const build: TemplateBuild<ReciboConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Recibos de pago", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Recibos", {
    paper: config.paper,
    showGridLines: false,
    tabColor: theme.primary,
  });
  const log = addSheet(wb, "Registro", { freezeRows: 4, tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Numeración",
        rows: [
          { key: "prefix", label: "Prefijo", value: config.prefix, kind: "text" },
          { key: "start", label: "Primer número", value: config.startNumber, kind: "integer" },
        ],
      },
    ],
  });
  const lists = addListsSheet(wb, theme, [
    { key: "payment", title: "Formas de pago", values: config.paymentMethods },
  ]);
  [17, 15, 15, 15, 12, 18].forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const contact = [
    config.taxId ? `${ctx.taxId.name}: ${config.taxId}` : "",
    config.address,
    config.phone,
  ]
    .filter(Boolean)
    .join(" · ");

  const refs: {
    number: string;
    date: string;
    from: string;
    concept: string;
    method: string;
    amount: string;
  }[] = [];
  const examples = [
    {
      from: "María Fernanda Reyes",
      concept: "Pago de mensualidad de marzo",
      amount: 1850,
      method: config.paymentMethods[0],
    },
    {
      from: "Inversiones El Sol",
      concept: "Abono a factura F-0102",
      amount: 12500.5,
      method: config.paymentMethods[1] ?? config.paymentMethods[0],
    },
  ];

  for (let i = 0; i < config.count; i++) {
    const b = 1 + i * BLOCK;
    ws.getRow(b).height = 24;
    // Banda superior
    ws.mergeCells(b, 1, b, 4);
    const name = ws.getCell(b, 1);
    name.value = config.businessName || "Nombre de tu negocio";
    name.font = font(theme, { bold: true, size: 14, color: theme.primaryDark });
    ws.mergeCells(b, 5, b, 6);
    const band = ws.getCell(b, 5);
    band.value = "RECIBO";
    band.font = font(theme, { bold: true, size: 14, color: theme.onPrimary });
    band.fill = solidFill(theme.primary);
    band.alignment = { horizontal: "center", vertical: "middle" };

    ws.mergeCells(b + 1, 1, b + 1, 4);
    const c = ws.getCell(b + 1, 1);
    c.value = contact || null;
    c.font = font(theme, { size: 9, color: theme.muted });
    const nl = ws.getCell(b + 1, 5);
    nl.value = "N.º";
    styleLabel(nl, theme);
    nl.alignment = { horizontal: "right" };
    const number = ws.getCell(b + 1, 6);
    number.value = {
      formula: `${params.ref("prefix")}&TEXT(${params.ref("start")}+${i},${formulaString("00000")})`,
    };
    styleCalc(number, theme);
    number.font = font(theme, { bold: true, color: theme.danger });
    number.alignment = { horizontal: "center" };

    const al = ws.getCell(b + 2, 5);
    al.value = "Por";
    styleLabel(al, theme);
    al.alignment = { horizontal: "right" };
    const amount = ws.getCell(b + 2, 6);
    amount.value = config.example && examples[i] ? examples[i]!.amount : null;
    styleInput(amount, theme);
    amount.numFmt = currencyFormat(ctx);
    decimalMin(ws, amount.address, 0);

    const rowField = (r: number, label: string) => {
      const l = ws.getCell(r, 1);
      l.value = label;
      styleLabel(l, theme);
      ws.mergeCells(r, 2, r, 6);
      return ws.getCell(r, 2);
    };
    const from = rowField(b + 3, "Recibí de:");
    from.value = config.example && examples[i] ? examples[i]!.from : null;
    styleInput(from, theme);
    const words = rowField(b + 4, "La cantidad de:");
    words.value = {
      formula: `IF(${absAddr(6, b + 2)}="","",${amountInWordsRef(wb, sheetRef(ws.name, absAddr(6, b + 2)), ctx)})`,
    };
    styleCalc(words, theme);
    words.font = font(theme, { size: 10, bold: true });
    const concept = rowField(b + 5, "En concepto de:");
    concept.value = config.example && examples[i] ? examples[i]!.concept : null;
    styleInput(concept, theme);

    const dl = ws.getCell(b + 6, 1);
    dl.value = "Fecha:";
    styleLabel(dl, theme);
    const date = ws.getCell(b + 6, 2);
    date.value = config.example && examples[i] ? new Date(Date.UTC(2026, 2, 15 + i)) : null;
    styleInput(date, theme);
    date.numFmt = FMT.date;
    dateValidation(ws, date.address);
    const ml = ws.getCell(b + 6, 3);
    ml.value = "Forma de pago:";
    styleLabel(ml, theme);
    ml.alignment = { horizontal: "right" };
    ws.mergeCells(b + 6, 4, b + 6, 5);
    const method = ws.getCell(b + 6, 4);
    method.value = config.example && examples[i] ? (examples[i]!.method ?? null) : null;
    styleInput(method, theme);
    listFromRange(ws, method.address, lists.source("payment"));

    for (const [c1, c2, label] of [
      [1, 2, "Recibí conforme"],
      [4, 6, "Entregué conforme"],
    ] as const) {
      ws.mergeCells(b + 8, c1, b + 8, c2);
      const s = ws.getCell(b + 8, c1);
      s.value = label;
      s.border = { top: { style: "thin" } };
      s.font = font(theme, { size: 9, color: theme.muted });
      s.alignment = { horizontal: "center", vertical: "top" };
    }
    // Línea de corte
    for (let col = 1; col <= 6; col++) {
      ws.getCell(b + 9, col).border = {
        bottom: { style: "dashed", color: { argb: toArgb(theme.border) } },
      };
    }
    if ((i + 1) % PER_PAGE === 0 && i + 1 < config.count) ws.getRow(b + 10).addPageBreak();

    refs.push({
      number: absAddr(6, b + 1),
      date: absAddr(2, b + 6),
      from: absAddr(2, b + 3),
      concept: absAddr(2, b + 5),
      method: absAddr(4, b + 6),
      amount: absAddr(6, b + 2),
    });
  }

  // Registro de recibos
  const r = (cell: string) => sheetRef(ws.name, cell);
  log.getCell("A1").value = "Registro de recibos";
  log.getCell("A1").font = font(theme, { bold: true, size: 16, color: theme.primaryDark });
  log.getCell("A2").value = "Se llena solo a partir de la hoja Recibos.";
  log.getCell("A2").font = font(theme, { italic: true, size: 9, color: theme.muted });
  const table = addTable(log, {
    startRow: 4,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        width: 14,
        formula: (x) => r(refs[x.index]!.number),
      },
      {
        key: "date",
        header: "Fecha",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (x) => `IF(${r(refs[x.index]!.date)}="","",${r(refs[x.index]!.date)})`,
      },
      {
        key: "from",
        header: "Recibí de",
        kind: "formula",
        width: 28,
        formula: (x) => `IF(${r(refs[x.index]!.from)}="","",${r(refs[x.index]!.from)})`,
      },
      {
        key: "concept",
        header: "Concepto",
        kind: "formula",
        width: 32,
        formula: (x) => `IF(${r(refs[x.index]!.concept)}="","",${r(refs[x.index]!.concept)})`,
      },
      {
        key: "method",
        header: "Forma de pago",
        kind: "formula",
        width: 16,
        formula: (x) => `IF(${r(refs[x.index]!.method)}="","",${r(refs[x.index]!.method)})`,
      },
      {
        key: "amount",
        header: "Monto",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (x) => `IF(${r(refs[x.index]!.amount)}="","",${r(refs[x.index]!.amount)})`,
      },
    ],
    rows: config.count,
    theme,
    ctx,
    totals: { label: "Total recibido" },
  });
  void table;
  await protectSheet(ws);
  await protectSheet(log);

  addInstructionsSheet(wb, {
    title: "Recibos de pago",
    description:
      "Talonario de recibos numerados con la cantidad en letras y un registro automático de lo cobrado.",
    steps: [
      "En cada recibo escribe el monto, de quién lo recibes, el concepto, la fecha y la forma de pago.",
      "La cantidad en letras y el número de recibo se completan solos.",
      "Imprime la hoja Recibos (3 recibos por página) y recorta por la línea punteada.",
      "La hoja Registro resume todos los recibos con el total cobrado.",
    ],
    sheets: [
      { name: "Recibos", description: "Recibos listos para llenar e imprimir." },
      { name: "Registro", description: "Resumen automático de los recibos emitidos." },
      { name: "Parámetros", description: "Prefijo y primer número del talonario." },
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
