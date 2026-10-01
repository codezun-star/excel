import type ExcelJS from "exceljs";
import { HyperFormula, type RawCellContent } from "hyperformula";

/**
 * Motor de cálculo para pruebas: convierte un workbook de ExcelJS a
 * HyperFormula (motor compatible con Excel) y evalúa las fórmulas reales
 * tal como quedan en el archivo. Solo se usa en tests (licencia GPLv3,
 * nunca se envía al navegador ni al servidor de producción).
 */

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function toSerial(date: Date): number {
  return (date.getTime() - EXCEL_EPOCH) / 86_400_000;
}

function cellToRaw(cell: ExcelJS.Cell): RawCellContent {
  if (cell.isMerged && cell.master.address !== cell.address) return null;
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (typeof v === "string") return v.startsWith("=") ? `'${v}` : v;
  if (v instanceof Date) return toSerial(v);
  if (typeof v === "object") {
    if ("formula" in v && typeof v.formula === "string") return `=${v.formula}`;
    if ("sharedFormula" in v) throw new Error("Las plantillas no deben usar fórmulas compartidas");
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("error" in v) return v.error;
  }
  return null;
}

export interface EvaluatedWorkbook {
  hf: HyperFormula;
  value: (sheet: string, address: string) => unknown;
  /** Todas las celdas con fórmula que devuelven un error de Excel */
  errors: () => { sheet: string; address: string; formula: string; error: string }[];
  formulaCount: () => number;
}

export function evaluateWorkbook(wb: ExcelJS.Workbook): EvaluatedWorkbook {
  const sheets: Record<string, RawCellContent[][]> = {};
  const formulas: { sheet: string; address: string; formula: string }[] = [];

  for (const ws of wb.worksheets) {
    const data: RawCellContent[][] = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const raw = cellToRaw(cell);
        if (raw === null) return;
        while (data.length < rowNumber) data.push([]);
        const r = data[rowNumber - 1]!;
        while (r.length < colNumber) r.push(null);
        r[colNumber - 1] = raw;
        if (typeof raw === "string" && raw.startsWith("=")) {
          formulas.push({ sheet: ws.name, address: cell.address, formula: raw });
        }
      });
    });
    sheets[ws.name] = data;
  }

  const hf = HyperFormula.buildFromSheets(sheets, {
    licenseKey: "gpl-v3",
    nullDate: { year: 1899, month: 12, day: 30 },
    dateFormats: ["DD/MM/YYYY"],
    useArrayArithmetic: false,
  });

  const value = (sheet: string, address: string) => {
    const sheetId = hf.getSheetId(sheet);
    if (sheetId === undefined) throw new Error(`Hoja inexistente: ${sheet}`);
    const a = hf.simpleCellAddressFromString(address.replace(/\$/g, ""), sheetId);
    if (!a) throw new Error(`Dirección inválida: ${address}`);
    const v = hf.getCellValue(a);
    if (v && typeof v === "object" && "type" in v) return `#ERROR:${String(v.value ?? v.type)}`;
    return v;
  };

  return {
    hf,
    value,
    formulaCount: () => formulas.length,
    errors: () =>
      formulas
        .map((f) => ({ ...f, result: value(f.sheet, f.address) }))
        .filter((f) => typeof f.result === "string" && f.result.startsWith("#ERROR"))
        .map((f) => ({
          sheet: f.sheet,
          address: f.address,
          formula: f.formula,
          error: String(f.result),
        })),
  };
}

/** Lee una referencia "'Hoja'!$A$1" o "Hoja!A1" y devuelve [hoja, dirección]. */
export function splitRef(ref: string): [string, string] {
  const m = /^'?(.+?)'?!(\$?[A-Z]+\$?\d+)$/.exec(ref);
  if (!m) throw new Error(`Referencia inválida: ${ref}`);
  return [m[1]!.replace(/''/g, "'"), m[2]!.replace(/\$/g, "")];
}

/** Escribe valores de entrada en un workbook (simula al usuario). */
export function setCells(ws: ExcelJS.Worksheet, values: Record<string, ExcelJS.CellValue>): void {
  for (const [address, v] of Object.entries(values)) {
    ws.getCell(address).value = v;
  }
}
