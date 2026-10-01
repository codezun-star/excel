import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { FMT } from "./formats";
import { absAddr, rangeAddr, sheetRef } from "./refs";
import { addSheet } from "./sheet";
import {
  font,
  styleHeader,
  styleInput,
  styleLabel,
  styleNote,
  styleTitle,
  type SheetTheme,
} from "./styles";
import { formatFor, type ColumnKind } from "./table";

export interface ParamRow {
  key: string;
  label: string;
  value: string | number | Date | null;
  kind: Exclude<ColumnKind, "formula" | "list">;
  note?: string;
}

export interface ParamTable {
  key: string;
  title: string;
  columns: { header: string; kind: Exclude<ColumnKind, "formula" | "list">; width?: number }[];
  rows: (string | number | null)[][];
  note?: string;
}

export interface ParamSection {
  title: string;
  rows: ParamRow[];
}

export interface ParamsRef {
  ws: ExcelJS.Worksheet;
  /** Referencia absoluta con hoja: ref("isv15") → "'Parámetros'!$C$6" */
  ref: (key: string) => string;
  /** Rango completo de una tabla de parámetros (sin encabezado) */
  table: (key: string) => string;
  /** Rango de una columna (0-based) de una tabla de parámetros */
  tableColumn: (key: string, index: number) => string;
  /** Celda absoluta (fila y columna 0-based) de una tabla de parámetros */
  tableCell: (key: string, row: number, col: number) => string;
  /** Número de filas de una tabla de parámetros */
  tableRows: (key: string) => number;
}

/**
 * Hoja "Parámetros": concentra todas las tasas y valores legales que usa la
 * plantilla, tomados del módulo del país. Las fórmulas siempre apuntan aquí,
 * nunca a valores escritos a mano. Las celdas son editables por si una tasa
 * cambia antes de regenerar el archivo.
 */
export function addParametersSheet(
  wb: ExcelJS.Workbook,
  opts: {
    ctx: CountryContext;
    theme: SheetTheme;
    sections: ParamSection[];
    tables?: ParamTable[];
    name?: string;
  },
): ParamsRef {
  const { ctx, theme } = opts;
  const ws = addSheet(wb, opts.name ?? "Parámetros", { tabColor: theme.highlight });
  ws.getColumn(1).width = 2;
  ws.getColumn(2).width = 46;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 18;
  ws.getColumn(5).width = 18;
  ws.getColumn(6).width = 18;

  const title = ws.getCell("B1");
  title.value = `Parámetros — ${ctx.name}`;
  styleTitle(title, theme, 16);
  const meta = ws.getCell("B2");
  meta.value =
    `Reglas ${ctx.rulesVersion} · Última revisión: ${ctx.lastReviewed}` +
    (ctx.reviewStatus === "pending" ? " · VALORES PENDIENTES DE VERIFICACIÓN OFICIAL" : "");
  styleNote(meta, theme);
  ws.mergeCells("B2:F2");
  const hint = ws.getCell("B3");
  hint.value =
    "Estos valores alimentan todas las fórmulas. Si una tasa cambia, actualízala aquí o regenera la plantilla en excel.codezun.com.";
  styleNote(hint, theme);
  ws.mergeCells("B3:F3");
  ws.getRow(3).height = 28;

  const refs = new Map<string, string>();
  const tables = new Map<
    string,
    {
      range: string;
      col: (i: number) => string;
      cell: (r: number, c: number) => string;
      rows: number;
    }
  >();
  let row = 5;

  for (const section of opts.sections) {
    const h = ws.getCell(row, 2);
    h.value = section.title;
    styleHeader(h, theme);
    h.alignment = { horizontal: "left", vertical: "middle" };
    const hv = ws.getCell(row, 3);
    hv.value = "Valor";
    styleHeader(hv, theme);
    row++;
    for (const p of section.rows) {
      if (refs.has(p.key)) throw new Error(`Parámetro duplicado: ${p.key}`);
      const label = ws.getCell(row, 2);
      label.value = p.label;
      styleLabel(label, theme, false);
      const cell = ws.getCell(row, 3);
      cell.value = p.value;
      styleInput(cell, theme);
      const fmt = formatFor(p.kind, ctx);
      if (fmt) cell.numFmt = fmt;
      if (p.kind === "text") cell.numFmt = FMT.text;
      if (p.note) cell.note = p.note;
      refs.set(p.key, sheetRef(ws.name, absAddr(3, row)));
      row++;
    }
    row++;
  }

  for (const t of opts.tables ?? []) {
    const h = ws.getCell(row, 2);
    h.value = t.title;
    h.font = font(theme, { bold: true, color: theme.primaryDark });
    row++;
    t.columns.forEach((c, i) => {
      const cell = ws.getCell(row, 2 + i);
      cell.value = c.header;
      styleHeader(cell, theme);
    });
    row++;
    const first = row;
    for (const values of t.rows) {
      values.forEach((v, i) => {
        const cell = ws.getCell(row, 2 + i);
        cell.value = v;
        styleInput(cell, theme);
        const fmt = formatFor(t.columns[i]?.kind, ctx);
        if (fmt) cell.numFmt = fmt;
      });
      row++;
    }
    const last = row - 1;
    tables.set(t.key, {
      range: sheetRef(ws.name, rangeAddr(2, first, 1 + t.columns.length, last, true)),
      col: (i) => sheetRef(ws.name, rangeAddr(2 + i, first, 2 + i, last, true)),
      cell: (r, c) => sheetRef(ws.name, absAddr(2 + c, first + r)),
      rows: t.rows.length,
    });
    if (t.note) {
      const n = ws.getCell(row, 2);
      n.value = t.note;
      styleNote(n, theme);
      ws.mergeCells(row, 2, row, 6);
      row++;
    }
    row++;
  }

  const sources = ws.getCell(row, 2);
  sources.value = `Fuentes: ${ctx.sources.map((s) => s.name).join(" · ")}`;
  styleNote(sources, theme);
  ws.mergeCells(row, 2, row, 6);

  const getTable = (key: string) => {
    const t = tables.get(key);
    if (!t) throw new Error(`Tabla de parámetros desconocida: ${key}`);
    return t;
  };

  return {
    ws,
    ref: (key) => {
      const r = refs.get(key);
      if (!r) throw new Error(`Parámetro desconocido: ${key}`);
      return r;
    },
    table: (key) => getTable(key).range,
    tableColumn: (key, index) => getTable(key).col(index),
    tableCell: (key, r, c) => getTable(key).cell(r, c),
    tableRows: (key) => getTable(key).rows,
  };
}

/** Filas estándar con las tasas de impuesto sobre ventas del país. */
export function salesTaxTable(ctx: CountryContext): ParamTable {
  return {
    key: "salesTax",
    title: `Tasas de ${ctx.taxes.salesTax.name}`,
    columns: [
      { header: "Tipo", kind: "text" },
      { header: "Tasa", kind: "percent" },
      { header: "Descripción", kind: "text" },
    ],
    rows: ctx.taxes.salesTax.rates.map((r) => [r.label, r.rate, r.description]),
  };
}
