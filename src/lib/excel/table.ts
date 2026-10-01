import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { FMT, USD_FORMAT, currencyFormat } from "./formats";
import { absAddr, addr, colLetter, rangeAddr, sheetRef } from "./refs";
import {
  font,
  solidFill,
  styleCalc,
  styleHeader,
  styleTotal,
  thinBorder,
  type SheetTheme,
} from "./styles";
import {
  dateValidation,
  decimalBetween,
  decimalMin,
  listFromRange,
  listInline,
  wholeMin,
} from "./validation";

export type ColumnKind =
  "text" | "number" | "integer" | "currency" | "usd" | "percent" | "date" | "list" | "formula";

export interface RowContext {
  /** Número de fila en la hoja */
  row: number;
  /** Índice 0 de la fila dentro de la tabla */
  index: number;
  isFirst: boolean;
  /** Celda de esta fila para la columna indicada: c("cantidad") → "D5" */
  c: (key: string) => string;
  /** Celda de la fila anterior (null en la primera fila) */
  prev: (key: string) => string | null;
  /** Rango absoluto completo de una columna: col("monto") → "$E$5:$E$104" */
  col: (key: string) => string;
  /** Rango desde la primera fila hasta la actual: upTo("monto") → "$E$5:E9" */
  upTo: (key: string) => string;
}

export type CellInput = string | number | boolean | Date | null | undefined;

export type TotalSpec = "sum" | "average" | "count" | "max" | "min" | ((range: string) => string);

export interface ColumnDef {
  key: string;
  header: string;
  kind: ColumnKind;
  width?: number;
  /** Para kind "formula": fórmula de la fila (sin "=") */
  formula?: (r: RowContext) => string;
  /** Formato del resultado de una fórmula (por defecto número) */
  resultKind?: Exclude<ColumnKind, "formula" | "list">;
  /** Para kind "list": valores fijos o un rango fuente ("'Listas'!$A$2:$A$30") */
  list?: string[] | { source: string };
  numFmt?: string;
  total?: TotalSpec;
  /** Valor mínimo para validar números (por defecto 0) */
  min?: number;
  allowNegative?: boolean;
  align?: "left" | "center" | "right";
  /** Nota (comentario) en el encabezado */
  note?: string;
  wrap?: boolean;
  /** Valor inicial para todas las filas (p. ej. tasa de ISV predeterminada) */
  fill?: CellInput;
}

export interface TableOptions {
  startRow: number;
  startCol?: number;
  columns: ColumnDef[];
  rows: number;
  theme: SheetTheme;
  ctx: CountryContext;
  zebra?: boolean;
  /** Fila de totales al final; label se coloca en la primera columna sin total */
  totals?: { label: string } | false;
  /** Datos de ejemplo para las primeras filas (solo columnas de captura) */
  example?: Array<Record<string, CellInput>>;
  autoFilter?: boolean;
  headerHeight?: number;
}

export interface TableRef {
  ws: ExcelJS.Worksheet;
  headerRow: number;
  firstRow: number;
  lastRow: number;
  totalRow: number | null;
  columns: ColumnDef[];
  colNumber: (key: string) => number;
  letter: (key: string) => string;
  /** Rango de datos de una columna, absoluto por defecto */
  range: (key: string, absolute?: boolean) => string;
  /** Rango de datos con nombre de hoja: "'Ventas'!$E$5:$E$104" */
  sheetRange: (key: string) => string;
  cell: (key: string, row: number, absolute?: boolean) => string;
  /** Dirección absoluta de la celda de total de una columna */
  total: (key: string) => string;
  sheetTotal: (key: string) => string;
}

export function formatFor(kind: ColumnKind | undefined, ctx: CountryContext): string | undefined {
  switch (kind) {
    case "currency":
      return currencyFormat(ctx);
    case "usd":
      return USD_FORMAT;
    case "percent":
      return FMT.percent;
    case "date":
      return FMT.date;
    case "integer":
      return FMT.integer;
    case "number":
      return FMT.number;
    case "text":
    case "list":
      return undefined;
    default:
      return undefined;
  }
}

/** Convierte "2026-01-15" a Date UTC (las fechas de Excel no tienen zona). */
export function toExcelValue(value: CellInput, kind: ColumnKind): ExcelJS.CellValue {
  if (value === undefined || value === null || value === "") return null;
  if (kind === "date" && typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }
  return value as ExcelJS.CellValue;
}

export function isoDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new Error(`Fecha inválida: ${value}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

/**
 * Escribe una tabla con encabezado, filas de captura o fórmula, validaciones,
 * filas cebra y fila de totales. Devuelve referencias para fórmulas externas.
 */
export function addTable(ws: ExcelJS.Worksheet, opts: TableOptions): TableRef {
  const startCol = opts.startCol ?? 1;
  const headerRow = opts.startRow;
  const firstRow = headerRow + 1;
  const lastRow = firstRow + Math.max(1, opts.rows) - 1;
  const zebra = opts.zebra ?? true;
  const keys = new Map<string, number>();

  opts.columns.forEach((col, i) => {
    if (keys.has(col.key)) throw new Error(`Columna duplicada: ${col.key}`);
    keys.set(col.key, startCol + i);
  });

  const colNumber = (key: string): number => {
    const n = keys.get(key);
    if (n === undefined) throw new Error(`Columna desconocida: ${key}`);
    return n;
  };
  const letter = (key: string) => colLetter(colNumber(key));
  const range = (key: string, absolute = true) =>
    rangeAddr(colNumber(key), firstRow, colNumber(key), lastRow, absolute);

  // Encabezados
  const header = ws.getRow(headerRow);
  header.height = opts.headerHeight ?? 30;
  opts.columns.forEach((col) => {
    const cell = header.getCell(colNumber(col.key));
    cell.value = col.header;
    styleHeader(cell, opts.theme);
    if (col.note) cell.note = col.note;
    if (col.width) ws.getColumn(colNumber(col.key)).width = col.width;
  });

  // Filas
  for (let r = firstRow; r <= lastRow; r++) {
    const index = r - firstRow;
    const rowCtx: RowContext = {
      row: r,
      index,
      isFirst: r === firstRow,
      c: (key) => addr(colNumber(key), r),
      prev: (key) => (r === firstRow ? null : addr(colNumber(key), r - 1)),
      col: (key) => range(key, true),
      upTo: (key) => `${absAddr(colNumber(key), firstRow)}:${addr(colNumber(key), r)}`,
    };
    const exampleRow = opts.example?.[index];
    const zebraFill = zebra && index % 2 === 1 ? opts.theme.zebra : "#FFFFFF";

    for (const col of opts.columns) {
      const cell = ws.getCell(r, colNumber(col.key));
      const fmt =
        col.numFmt ?? formatFor(col.kind === "formula" ? col.resultKind : col.kind, opts.ctx);
      if (fmt) cell.numFmt = fmt;
      cell.alignment = {
        vertical: "middle",
        horizontal: col.align,
        wrapText: col.wrap ?? false,
      };

      if (col.kind === "formula") {
        if (!col.formula) throw new Error(`La columna ${col.key} necesita formula`);
        cell.value = { formula: col.formula(rowCtx) };
        styleCalc(cell, opts.theme);
      } else {
        const exampleValue = exampleRow?.[col.key];
        const value = exampleValue !== undefined ? exampleValue : col.fill;
        cell.value = toExcelValue(value, col.kind);
        cell.fill = solidFill(zebraFill);
        cell.font = font(opts.theme);
        cell.border = thinBorder(opts.theme.border);
        cell.protection = { locked: false };
      }
    }
  }

  // Validaciones por columna (un solo rango por columna)
  for (const col of opts.columns) {
    const target = range(col.key, false);
    switch (col.kind) {
      case "currency":
      case "usd":
      case "number":
        if (!col.allowNegative) decimalMin(ws, target, col.min ?? 0);
        break;
      case "integer":
        if (!col.allowNegative) wholeMin(ws, target, col.min ?? 0);
        break;
      case "percent":
        decimalBetween(ws, target, 0, 1, "Escribe un porcentaje entre 0% y 100%.");
        break;
      case "date":
        dateValidation(ws, target);
        break;
      case "list":
        if (Array.isArray(col.list)) listInline(ws, target, col.list);
        else if (col.list) listFromRange(ws, target, col.list.source);
        break;
      default:
        break;
    }
  }

  // Totales
  let totalRow: number | null = null;
  if (opts.totals) {
    totalRow = lastRow + 1;
    const row = ws.getRow(totalRow);
    row.height = 22;
    let labelPlaced = false;
    for (const col of opts.columns) {
      const cell = row.getCell(colNumber(col.key));
      styleTotal(cell, opts.theme);
      if (col.total) {
        const rng = range(col.key, false);
        let formula: string;
        if (typeof col.total === "function") formula = col.total(rng);
        else if (col.total === "average") formula = `IFERROR(AVERAGE(${rng}),"")`;
        else if (col.total === "count") formula = `COUNTA(${rng})`;
        else formula = `${col.total.toUpperCase()}(${rng})`;
        cell.value = { formula };
        const fmt =
          col.total === "count"
            ? FMT.integer
            : (col.numFmt ??
              formatFor(col.kind === "formula" ? col.resultKind : col.kind, opts.ctx));
        if (fmt) cell.numFmt = fmt;
      } else if (!labelPlaced) {
        cell.value = opts.totals.label;
        cell.alignment = { horizontal: "left", vertical: "middle" };
        labelPlaced = true;
      }
    }
  }

  if (opts.autoFilter) {
    ws.autoFilter = {
      from: { row: headerRow, column: startCol },
      to: { row: headerRow, column: startCol + opts.columns.length - 1 },
    };
  }

  const total = (key: string) => {
    if (totalRow === null) throw new Error("La tabla no tiene fila de totales");
    return absAddr(colNumber(key), totalRow);
  };

  return {
    ws,
    headerRow,
    firstRow,
    lastRow,
    totalRow,
    columns: opts.columns,
    colNumber,
    letter,
    range,
    sheetRange: (key) => sheetRef(ws.name, range(key, true)),
    cell: (key, row, absolute = false) =>
      absolute ? absAddr(colNumber(key), row) : addr(colNumber(key), row),
    total,
    sheetTotal: (key) => sheetRef(ws.name, total(key)),
  };
}

/** Envuelve una fórmula para que quede vacía mientras la celda guía esté vacía. */
export function blankUnless(guide: string, formula: string): string {
  return `IF(${guide}="","",${formula})`;
}

/** Igual que blankUnless pero con varias celdas guía (todas deben tener dato). */
export function blankUnlessAll(guides: string[], formula: string): string {
  return `IF(OR(${guides.map((g) => `${g}=""`).join(",")}),"",${formula})`;
}
