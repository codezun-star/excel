import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { offsetCell } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange, ifLabel } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { RemesasConfig } from "./form";

export const build: TemplateBuild<RemesasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const wb = createWorkbook({
    title: titleWith(`Remesas ${y}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Remesas", { freezeRows: 6, landscape: true, tabColor: theme.primary });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "companies", title: "Empresas", values: config.companies },
    { key: "uses", title: "Usos", values: config.uses },
  ]);
  addSheetHeader(ws, {
    title: titleWith(`Control de remesas ${y}`, config.businessName),
    subtitle: `Montos recibidos en dólares y su equivalente en ${ctx.currency.code}.`,
    theme,
    width: 9,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "rate",
        label: "Tipo de cambio de referencia",
        kind: "number",
        value: config.exchangeRate,
        note: "Se usa si una fila no tiene tipo de cambio propio.",
      },
    ],
    theme,
    ctx,
  });
  const ex = config.example;
  const table = addTable(ws, {
    startRow: 6,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "sender", header: "Remitente", kind: "text", width: 22 },
      {
        key: "company",
        header: "Empresa",
        kind: "list",
        width: 18,
        list: { source: lists.source("companies") },
      },
      { key: "usd", header: "Monto (US$)", kind: "usd", width: 13, total: "sum" },
      {
        key: "rate",
        header: "Tipo de cambio",
        kind: "number",
        width: 11,
        note: "Déjalo vacío para usar el de referencia.",
      },
      {
        key: "fee",
        header: `Comisión (${ctx.currency.symbol})`,
        kind: "currency",
        width: 12,
        total: "sum",
      },
      {
        key: "local",
        header: `Recibido (${ctx.currency.code})`,
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("usd")}="","",ROUND(${r.c("usd")}*IF(${r.c("rate")}="",${top.cell("rate")},${r.c("rate")})-${r.c("fee")},2))`,
      },
      {
        key: "use",
        header: "Uso principal",
        kind: "list",
        width: 16,
        list: { source: lists.source("uses") },
      },
      { key: "note", header: "Nota", kind: "text", width: 24 },
    ],
    rows: 300,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 6),
            sender: "Carlos (hijo)",
            company: config.companies[0],
            usd: 300,
            rate: 26.4,
            fee: 0,
            use: config.uses[0],
          },
          {
            date: exampleDate(y, 1, 20),
            sender: "Ana (hermana)",
            company: config.companies[1] ?? config.companies[0],
            usd: 200,
            fee: 50,
            use: config.uses[1] ?? config.uses[0],
          },
          {
            date: exampleDate(y, 2, 5),
            sender: "Carlos (hijo)",
            company: config.companies[0],
            usd: 350,
            rate: 26.5,
            fee: 0,
            use: config.uses[0],
          },
        ]
      : undefined,
  });

  addSheetHeader(summary, { title: `Resumen de remesas ${y}`, theme, width: 4 });
  const f = addFields(summary, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const Y = f.cell("year");
  const R = (k: string) => table.sheetRange(k);
  const monthly = addMonthlySummary(summary, {
    startRow: 6,
    startCol: 1,
    yearCell: Y,
    theme,
    ctx,
    values: [
      {
        header: "Remesas",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${R("date")},">="&${k.monthStart},${R("date")},"<="&${k.monthEnd},${R("usd")},">0")`,
      },
      {
        header: "US$",
        kind: "usd",
        formula: (k) =>
          `SUMIFS(${R("usd")},${R("date")},">="&${k.monthStart},${R("date")},"<="&${k.monthEnd})`,
      },
      {
        header: ctx.currency.code,
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("local")},${R("date")},">="&${k.monthStart},${R("date")},"<="&${k.monthEnd})`,
      },
    ],
  });
  addCategorySummary(summary, {
    startRow: monthly.totalRow + 2,
    startCol: 1,
    labelHeader: "Uso",
    sourceCells: cellsOfRange(lists.source("uses")),
    values: [
      {
        header: ctx.currency.code,
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIFS(${R("local")},${R("use")},${k.labelCell},${R("date")},">="&DATE(${Y},1,1),${R("date")},"<="&DATE(${Y},12,31))`,
          ),
      },
      {
        header: "%",
        kind: "percent",
        formula: (k) =>
          ifLabel(k, `IFERROR(${offsetCell(k.labelCell, 1)}/${monthly.totalCell(2)},0)`),
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(summary);
  addInstructionsSheet(wb, {
    title: "Control de remesas",
    description:
      "Sabe cuánto dinero ha llegado, cuánto se pierde en comisiones y en qué se está usando.",
    steps: [
      "Escribe el tipo de cambio de referencia.",
      "Registra cada remesa: fecha, quién la envía, la empresa, el monto en dólares, el tipo de cambio del día (opcional) y la comisión.",
      "Elige el uso principal del dinero.",
      "La hoja Resumen muestra el total por mes y por uso.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
