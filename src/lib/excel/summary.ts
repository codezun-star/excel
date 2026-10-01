import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { FMT } from "./formats";
import { absAddr, addr } from "./refs";
import { font, styleCalc, styleHeader, styleTotal, type SheetTheme } from "./styles";
import { formatFor, type ColumnKind } from "./table";

export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface SummaryValue {
  header: string;
  kind: Exclude<ColumnKind, "formula" | "list">;
  /** Fórmula de la celda para la fila: recibe la clave de fila (mes o categoría) */
  formula: (key: SummaryRowKey) => string;
  /** Fórmula de la fila de totales (por defecto SUM de la columna) */
  total?: ((range: string) => string) | false;
}

export interface SummaryRowKey {
  /** Celda con la etiqueta de la fila (categoría o nombre del mes) */
  labelCell: string;
  /** Para resúmenes mensuales: expresión de la fecha inicial del mes */
  monthStart?: string;
  /** Para resúmenes mensuales: expresión de la fecha final del mes */
  monthEnd?: string;
  /** Número de mes 1..12 (resúmenes mensuales) */
  month?: number;
  row: number;
}

export interface SummaryRef {
  firstRow: number;
  lastRow: number;
  totalRow: number;
  column: (index: number) => string;
  totalCell: (index: number) => string;
}

function writeSummary(
  ws: ExcelJS.Worksheet,
  opts: {
    startRow: number;
    startCol: number;
    labelHeader: string;
    labels: ({ value: string } | { formula: string })[];
    values: SummaryValue[];
    theme: SheetTheme;
    ctx: CountryContext;
    keyFor: (i: number, labelCell: string, row: number) => SummaryRowKey;
    totalLabel?: string;
    labelWidth?: number;
  },
): SummaryRef {
  const { theme, ctx } = opts;
  const h = ws.getCell(opts.startRow, opts.startCol);
  h.value = opts.labelHeader;
  styleHeader(h, theme);
  if (opts.labelWidth) ws.getColumn(opts.startCol).width = opts.labelWidth;
  opts.values.forEach((v, i) => {
    const c = ws.getCell(opts.startRow, opts.startCol + 1 + i);
    c.value = v.header;
    styleHeader(c, theme);
    const col = ws.getColumn(opts.startCol + 1 + i);
    col.width = Math.max(col.width ?? 10, 15);
  });
  const firstRow = opts.startRow + 1;
  opts.labels.forEach((label, i) => {
    const r = firstRow + i;
    const lc = ws.getCell(r, opts.startCol);
    lc.value = "value" in label ? label.value : { formula: label.formula };
    styleCalc(lc, theme);
    lc.font = font(theme, { bold: true });
    const key = opts.keyFor(i, addr(opts.startCol, r), r);
    opts.values.forEach((v, j) => {
      const cell = ws.getCell(r, opts.startCol + 1 + j);
      cell.value = { formula: v.formula(key) };
      styleCalc(cell, theme);
      const fmt = formatFor(v.kind, ctx);
      if (fmt) cell.numFmt = fmt;
    });
  });
  const lastRow = firstRow + opts.labels.length - 1;
  const totalRow = lastRow + 1;
  const tl = ws.getCell(totalRow, opts.startCol);
  tl.value = opts.totalLabel ?? "Total";
  styleTotal(tl, theme);
  opts.values.forEach((v, j) => {
    const col = opts.startCol + 1 + j;
    const cell = ws.getCell(totalRow, col);
    styleTotal(cell, theme);
    if (v.total === false) return;
    const rng = `${addr(col, firstRow)}:${addr(col, lastRow)}`;
    cell.value = { formula: v.total ? v.total(rng) : `SUM(${rng})` };
    const fmt = formatFor(v.kind, ctx);
    if (fmt) cell.numFmt = fmt;
  });
  return {
    firstRow,
    lastRow,
    totalRow,
    column: (index) =>
      `${absAddr(opts.startCol + 1 + index, firstRow)}:${absAddr(opts.startCol + 1 + index, lastRow)}`,
    totalCell: (index) => absAddr(opts.startCol + 1 + index, totalRow),
  };
}

/**
 * Resumen de 12 meses para el año indicado en `yearCell`. Cada valor recibe
 * monthStart/monthEnd para armar SUMIFS(..., fecha, ">="&inicio, fecha, "<="&fin).
 */
export function addMonthlySummary(
  ws: ExcelJS.Worksheet,
  opts: {
    startRow: number;
    startCol: number;
    yearCell: string;
    values: SummaryValue[];
    theme: SheetTheme;
    ctx: CountryContext;
  },
): SummaryRef {
  return writeSummary(ws, {
    ...opts,
    labelHeader: "Mes",
    labelWidth: 14,
    labels: MONTHS_ES.map((m) => ({ value: m })),
    keyFor: (i, labelCell, row) => ({
      labelCell,
      row,
      month: i + 1,
      monthStart: `DATE(${opts.yearCell},${i + 1},1)`,
      monthEnd: `EOMONTH(DATE(${opts.yearCell},${i + 1},1),0)`,
    }),
  });
}

/**
 * Resumen por categoría tomando las etiquetas de un rango (p. ej. la hoja
 * Listas, incluidas sus filas libres): cada fila muestra la categoría o
 * queda vacía si la celda de origen está vacía.
 */
export function addCategorySummary(
  ws: ExcelJS.Worksheet,
  opts: {
    startRow: number;
    startCol: number;
    labelHeader: string;
    /** Celdas de origen, una por fila ("'Listas'!$A$2", ...) */
    sourceCells: string[];
    values: SummaryValue[];
    theme: SheetTheme;
    ctx: CountryContext;
    labelWidth?: number;
  },
): SummaryRef {
  return writeSummary(ws, {
    ...opts,
    labels: opts.sourceCells.map((src) => ({ formula: `IF(${src}="","",${src})` })),
    keyFor: (_i, labelCell, row) => ({ labelCell, row }),
  });
}

/** Celdas individuales de un rango vertical "'Hoja'!$A$2:$A$20". */
export function cellsOfRange(range: string): string[] {
  const m = /^(.*!)?\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(range);
  if (!m) throw new Error(`Rango inválido: ${range}`);
  const prefix = m[1] ?? "";
  const col = m[2]!;
  const r1 = Number(m[3]);
  const r2 = Number(m[5]);
  const out: string[] = [];
  for (let r = r1; r <= r2; r++) out.push(`${prefix}$${col}$${r}`);
  return out;
}

/** Envuelve una fórmula de resumen para que quede vacía si la etiqueta está vacía. */
export function ifLabel(key: SummaryRowKey, formula: string): string {
  return `IF(${key.labelCell}="","",${formula})`;
}

export const PERCENT_KIND = "percent" as const;
export { FMT };
