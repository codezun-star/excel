import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { absAddr, sheetRef } from "./refs";
import {
  font,
  solidFill,
  styleCalc,
  styleInput,
  styleLabel,
  styleNote,
  styleTitle,
  styleTotal,
  type SheetTheme,
} from "./styles";
import { formatFor, toExcelValue, type CellInput, type ColumnKind } from "./table";
import { dateValidation, decimalMin, listFromRange, listInline, wholeMin } from "./validation";

/** Título y subtítulo en la parte superior de una hoja de datos. */
export function addSheetHeader(
  ws: ExcelJS.Worksheet,
  opts: { title: string; subtitle?: string; theme: SheetTheme; width: number; startCol?: number },
): number {
  const c1 = opts.startCol ?? 1;
  const c2 = Math.max(c1, c1 + opts.width - 1);
  ws.getRow(1).height = 28;
  if (c2 > c1) ws.mergeCells(1, c1, 1, c2);
  const t = ws.getCell(1, c1);
  t.value = opts.title;
  styleTitle(t, opts.theme, 16);
  if (opts.subtitle) {
    if (c2 > c1) ws.mergeCells(2, c1, 2, c2);
    const s = ws.getCell(2, c1);
    s.value = opts.subtitle;
    styleNote(s, opts.theme);
    s.alignment = { vertical: "middle", wrapText: false };
  }
  return opts.subtitle ? 4 : 3;
}

export interface FieldSpec {
  key: string;
  label: string;
  kind: Exclude<ColumnKind, "formula"> | "calc";
  /** Para "calc": fórmula; recibe las referencias de los campos anteriores */
  formula?: (ref: (key: string) => string) => string;
  /** Formato del resultado cuando kind = "calc" */
  resultKind?: Exclude<ColumnKind, "formula" | "list">;
  value?: CellInput;
  list?: string[] | { source: string };
  note?: string;
  emphasis?: boolean;
}

export interface FieldsRef {
  /** Dirección absoluta en la hoja ("$C$4") */
  cell: (key: string) => string;
  /** Con nombre de hoja ("'Caja'!$C$4") */
  ref: (key: string) => string;
  nextRow: number;
}

/**
 * Bloque vertical de etiqueta + valor (configuración de la hoja, resultados
 * de una calculadora). Las celdas de captura quedan en crema y desbloqueadas;
 * las calculadas en gris o verde (emphasis).
 */
export function addFields(
  ws: ExcelJS.Worksheet,
  opts: {
    startRow: number;
    labelCol: number;
    valueCol: number;
    /** Columnas adicionales a combinar para el valor */
    valueSpan?: number;
    labelSpan?: number;
    fields: FieldSpec[];
    theme: SheetTheme;
    ctx: CountryContext;
    title?: string;
  },
): FieldsRef {
  const refs = new Map<string, string>();
  let row = opts.startRow;
  const ref = (key: string) => {
    const r = refs.get(key);
    if (!r) throw new Error(`Campo desconocido: ${key}`);
    return r;
  };
  if (opts.title) {
    const span = opts.valueCol - opts.labelCol + (opts.valueSpan ?? 1);
    ws.mergeCells(row, opts.labelCol, row, opts.labelCol + span - 1);
    const h = ws.getCell(row, opts.labelCol);
    h.value = opts.title;
    h.font = font(opts.theme, { bold: true, color: opts.theme.onPrimary });
    h.fill = solidFill(opts.theme.primary);
    h.alignment = { vertical: "middle", indent: 1 };
    row++;
  }
  for (const f of opts.fields) {
    if ((opts.labelSpan ?? 1) > 1)
      ws.mergeCells(row, opts.labelCol, row, opts.labelCol + (opts.labelSpan ?? 1) - 1);
    const l = ws.getCell(row, opts.labelCol);
    l.value = f.label;
    styleLabel(l, opts.theme, f.emphasis ?? false);
    if ((opts.valueSpan ?? 1) > 1)
      ws.mergeCells(row, opts.valueCol, row, opts.valueCol + (opts.valueSpan ?? 1) - 1);
    const v = ws.getCell(row, opts.valueCol);
    const address = absAddr(opts.valueCol, row);
    const plain = address.replace(/\$/g, "");
    if (f.kind === "calc") {
      if (!f.formula) throw new Error(`El campo ${f.key} necesita formula`);
      v.value = { formula: f.formula((k) => refs.get(k) ?? ref(k)) };
      if (f.emphasis) styleTotal(v, opts.theme);
      else styleCalc(v, opts.theme);
      const fmt = formatFor(f.resultKind, opts.ctx);
      if (fmt) v.numFmt = fmt;
    } else {
      v.value = toExcelValue(f.value, f.kind);
      styleInput(v, opts.theme);
      const fmt = formatFor(f.kind, opts.ctx);
      if (fmt) v.numFmt = fmt;
      if (f.kind === "date") dateValidation(ws, plain);
      else if (f.kind === "currency" || f.kind === "number" || f.kind === "usd")
        decimalMin(ws, plain, 0);
      else if (f.kind === "integer") wholeMin(ws, plain, 0);
      else if (f.kind === "list" && f.list) {
        if (Array.isArray(f.list)) listInline(ws, plain, f.list);
        else listFromRange(ws, plain, f.list.source);
      }
    }
    if (f.note) v.note = f.note;
    v.alignment = { ...(v.alignment ?? {}), vertical: "middle" };
    refs.set(f.key, address);
    row++;
  }
  return {
    cell: ref,
    ref: (key) => sheetRef(ws.name, ref(key)),
    nextRow: row,
  };
}
