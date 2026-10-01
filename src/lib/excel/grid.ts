import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { addr, colLetter } from "./refs";
import {
  font,
  solidFill,
  styleCalc,
  styleHeader,
  styleInput,
  styleTotal,
  thinBorder,
  type SheetTheme,
} from "./styles";
import { formatFor, type ColumnKind } from "./table";
import { decimalMin } from "./validation";

/**
 * Cuadrícula de categorías × meses (presupuestos, flujos de caja, planes):
 * secciones con filas de captura, subtotales por sección y columna de total.
 */
export interface GridSection {
  key: string;
  title: string;
  rows: string[];
  subtotalLabel?: string;
  /** Filas libres adicionales al final de la sección */
  spare?: number;
}

export interface GridRef {
  firstCol: number;
  lastCol: number;
  totalCol: number;
  headerRow: number;
  nextRow: number;
  monthCol: (i: number) => number;
  /** Fila del subtotal de una sección */
  subtotalRow: (section: string) => number;
  /** Rango de filas de captura de una sección en una columna */
  sectionRange: (section: string, col: number) => string;
  /** Filas de captura de una sección (para resúmenes) */
  sectionRows: (section: string) => { first: number; last: number };
  /** Agrega una fila calculada con una fórmula por columna de mes */
  addRow: (
    label: string,
    formula: (monthIndex: number, col: number, row: number) => string,
    opts?: {
      emphasis?: boolean;
      total?: "sum" | "last" | "none";
      kind?: Exclude<ColumnKind, "formula" | "list">;
    },
  ) => number;
}

export function addMonthGrid(
  ws: ExcelJS.Worksheet,
  opts: {
    startRow: number;
    labelHeader: string;
    monthHeaders: string[];
    sections: GridSection[];
    theme: SheetTheme;
    ctx: CountryContext;
    kind?: Exclude<ColumnKind, "formula" | "list">;
    labelWidth?: number;
    example?: Record<string, (number | null)[][]>;
    totalHeader?: string;
  },
): GridRef {
  const { theme, ctx } = opts;
  const kind = opts.kind ?? "currency";
  const fmt = formatFor(kind, ctx);
  const firstCol = 2;
  const months = opts.monthHeaders.length;
  const lastCol = firstCol + months - 1;
  const totalCol = lastCol + 1;
  ws.getColumn(1).width = opts.labelWidth ?? 32;
  for (let c = firstCol; c <= totalCol; c++) ws.getColumn(c).width = 13;

  const header = opts.startRow;
  const h = ws.getCell(header, 1);
  h.value = opts.labelHeader;
  styleHeader(h, theme);
  h.alignment = { horizontal: "left", vertical: "middle" };
  opts.monthHeaders.forEach((m, i) => {
    const c = ws.getCell(header, firstCol + i);
    c.value = m;
    styleHeader(c, theme);
  });
  const th = ws.getCell(header, totalCol);
  th.value = opts.totalHeader ?? "Total";
  styleHeader(th, theme);

  let row = header + 1;
  const subtotals = new Map<string, number>();
  const ranges = new Map<string, { first: number; last: number }>();

  const writeTotal = (
    r: number,
    mode: "sum" | "last" | "none",
    style: (c: ExcelJS.Cell) => void,
  ) => {
    const t = ws.getCell(r, totalCol);
    if (mode === "sum") t.value = { formula: `SUM(${addr(firstCol, r)}:${addr(lastCol, r)})` };
    else if (mode === "last") t.value = { formula: addr(lastCol, r) };
    style(t);
    if (fmt) t.numFmt = fmt;
  };

  for (const section of opts.sections) {
    ws.mergeCells(row, 1, row, totalCol);
    const title = ws.getCell(row, 1);
    title.value = section.title;
    title.font = font(theme, { bold: true, color: theme.primaryDark });
    title.fill = solidFill(theme.soft);
    title.border = thinBorder(theme.border);
    row++;
    const labels = [...section.rows, ...Array.from({ length: section.spare ?? 0 }, () => "")];
    const first = row;
    labels.forEach((label, i) => {
      const lc = ws.getCell(row, 1);
      lc.value = label || null;
      styleInput(lc, theme, i % 2 ? theme.zebra : "#FFFFFF");
      for (let m = 0; m < months; m++) {
        const c = ws.getCell(row, firstCol + m);
        styleInput(c, theme, i % 2 ? theme.zebra : "#FFFFFF");
        if (fmt) c.numFmt = fmt;
        const v = opts.example?.[section.key]?.[i]?.[m];
        if (v !== undefined && v !== null) c.value = v;
      }
      writeTotal(row, "sum", (c) => styleCalc(c, theme));
      row++;
    });
    const last = row - 1;
    ranges.set(section.key, { first, last });
    decimalMin(ws, `${colLetter(firstCol)}${first}:${colLetter(lastCol)}${last}`, 0);
    const st = ws.getCell(row, 1);
    st.value = section.subtotalLabel ?? `Total ${section.title.toLowerCase()}`;
    styleTotal(st, theme);
    for (let m = 0; m < months; m++) {
      const c = ws.getCell(row, firstCol + m);
      c.value = { formula: `SUM(${addr(firstCol + m, first)}:${addr(firstCol + m, last)})` };
      styleTotal(c, theme);
      if (fmt) c.numFmt = fmt;
    }
    writeTotal(row, "sum", (c) => styleTotal(c, theme));
    subtotals.set(section.key, row);
    row++;
  }

  const ref: GridRef = {
    firstCol,
    lastCol,
    totalCol,
    headerRow: header,
    get nextRow() {
      return row;
    },
    monthCol: (i) => firstCol + i,
    subtotalRow: (key) => {
      const r = subtotals.get(key);
      if (!r) throw new Error(`Sección desconocida: ${key}`);
      return r;
    },
    sectionRange: (key, col) => {
      const r = ranges.get(key);
      if (!r) throw new Error(`Sección desconocida: ${key}`);
      return `${addr(col, r.first)}:${addr(col, r.last)}`;
    },
    sectionRows: (key) => {
      const r = ranges.get(key);
      if (!r) throw new Error(`Sección desconocida: ${key}`);
      return r;
    },
    addRow: (label, formula, o = {}) => {
      const r = row;
      const lc = ws.getCell(r, 1);
      lc.value = label;
      if (o.emphasis) styleTotal(lc, theme);
      else {
        styleCalc(lc, theme);
        lc.font = font(theme, { bold: true });
      }
      const rowFmt = formatFor(o.kind ?? kind, ctx);
      for (let m = 0; m < months; m++) {
        const c = ws.getCell(r, firstCol + m);
        c.value = { formula: formula(m, firstCol + m, r) };
        if (o.emphasis) styleTotal(c, theme);
        else styleCalc(c, theme);
        if (rowFmt) c.numFmt = rowFmt;
      }
      writeTotal(r, o.total ?? "sum", (c) =>
        o.emphasis ? styleTotal(c, theme) : styleCalc(c, theme),
      );
      row++;
      return r;
    },
  };
  return ref;
}

/** Encabezados de 12 meses a partir de un mes y año: "Ene 2026", "Feb 2026"… */
export function monthHeadersFrom(month: number, year: number, count = 12): string[] {
  const short = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return Array.from({ length: count }, (_, i) => {
    const m = (month - 1 + i) % 12;
    const y = year + Math.floor((month - 1 + i) / 12);
    return `${short[m]} ${y}`;
  });
}
