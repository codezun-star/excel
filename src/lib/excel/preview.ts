import type ExcelJS from "exceljs";

/**
 * Convierte un workbook de ExcelJS en una estructura serializable para
 * mostrar una vista previa en HTML (primeras filas y columnas de cada hoja
 * visible). Las fórmulas se muestran como "ƒx" con el texto de la fórmula.
 */
export interface PreviewCell {
  v: string;
  t: "text" | "number" | "formula" | "empty" | "masked";
  f?: string;
  bold?: boolean;
  italic?: boolean;
  fill?: string;
  color?: string;
  align?: "left" | "center" | "right";
  size?: number;
  colSpan?: number;
  rowSpan?: number;
  /** Celda cubierta por una combinación (no se dibuja) */
  covered?: boolean;
}

export interface PreviewSheet {
  name: string;
  widths: number[];
  rows: { height: number; cells: PreviewCell[] }[];
  totalRows: number;
  totalCols: number;
  truncated: boolean;
}

export interface PreviewData {
  sheets: PreviewSheet[];
  limited: boolean;
}

export interface PreviewOptions {
  maxRows?: number;
  maxCols?: number;
  /** Vista previa limitada (plantillas Pro sin acceso): oculta fórmulas y valores */
  limited?: boolean;
  /** Filas visibles en modo limitado */
  limitedRows?: number;
}

function argbToHex(argb?: string): string | undefined {
  if (!argb || argb.length < 6) return undefined;
  const hex = argb.length === 8 ? argb.slice(2) : argb;
  return `#${hex}`;
}

function formatNumber(value: number, numFmt?: string): string {
  const fmt = numFmt ?? "";
  if (fmt.includes("%")) {
    const decimals = /0\.(0+)%/.exec(fmt)?.[1]?.length ?? 0;
    return `${(value * 100).toFixed(decimals)} %`;
  }
  if (fmt.includes("hh:mm")) {
    const minutes = Math.round(value * 24 * 60);
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }
  if (/d{1,2}\/m{1,2}\/y{2,4}/i.test(fmt)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86_400_000);
    return formatDate(date);
  }
  const symbol = /^"([^"]+)"/.exec(fmt)?.[1]?.trim();
  const decimals = fmt.includes(".00")
    ? 2
    : fmt.includes("#,##0") || fmt === "0"
      ? 0
      : Number.isInteger(value)
        ? 0
        : 2;
  const formatted = new Intl.NumberFormat("es-HN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return symbol ? `${symbol} ${formatted}` : formatted;
}

function formatDate(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getUTCFullYear()}`;
}

function cellToPreview(cell: ExcelJS.Cell): PreviewCell {
  const out: PreviewCell = { v: "", t: "empty" };
  const v = cell.value;
  if (v === null || v === undefined) {
    out.t = "empty";
  } else if (typeof v === "number") {
    out.t = "number";
    out.v = formatNumber(v, cell.numFmt);
  } else if (typeof v === "string") {
    out.t = "text";
    out.v = v;
  } else if (typeof v === "boolean") {
    out.t = "text";
    out.v = v ? "VERDADERO" : "FALSO";
  } else if (v instanceof Date) {
    out.t = "text";
    out.v = formatDate(v);
  } else if (typeof v === "object") {
    if ("formula" in v && v.formula) {
      out.t = "formula";
      out.v = "ƒx";
      out.f = `=${v.formula}`;
    } else if ("richText" in v) {
      out.t = "text";
      out.v = v.richText.map((r) => r.text).join("");
    } else if ("text" in v && typeof v.text === "string") {
      out.t = "text";
      out.v = v.text;
    }
  }
  const fill = cell.fill as ExcelJS.FillPattern | undefined;
  if (fill && fill.type === "pattern" && fill.pattern === "solid")
    out.fill = argbToHex(fill.fgColor?.argb);
  if (cell.font) {
    if (cell.font.bold) out.bold = true;
    if (cell.font.italic) out.italic = true;
    if (cell.font.size && cell.font.size !== 11) out.size = cell.font.size;
    const color = argbToHex(cell.font.color?.argb);
    if (color && color !== "#000000") out.color = color;
  }
  const h = cell.alignment?.horizontal;
  if (h === "center" || h === "right" || h === "left") out.align = h;
  else if (out.t === "number" || out.t === "formula") out.align = "right";
  return out;
}

export function workbookToPreview(wb: ExcelJS.Workbook, opts: PreviewOptions = {}): PreviewData {
  const maxRows = opts.limited ? (opts.limitedRows ?? 12) : (opts.maxRows ?? 45);
  const maxCols = opts.maxCols ?? 18;
  const sheets: PreviewSheet[] = [];

  for (const ws of wb.worksheets) {
    if (ws.state && ws.state !== "visible") continue;
    const totalRows = ws.rowCount;
    const totalCols = Math.min(ws.columnCount, 60);
    const rowsCount = Math.min(totalRows, maxRows);
    const colsCount = Math.min(totalCols, maxCols);

    // Combinaciones de celdas
    const spans = new Map<string, { colSpan: number; rowSpan: number }>();
    const covered = new Set<string>();
    const merges = (ws.model as unknown as { merges?: string[] }).merges ?? [];
    for (const range of merges) {
      const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
      if (!m) continue;
      const c1 = colToNum(m[1]!);
      const r1 = Number(m[2]);
      const c2 = Math.min(colToNum(m[3]!), colsCount);
      const r2 = Math.min(Number(m[4]), rowsCount);
      if (c1 > colsCount || r1 > rowsCount) continue;
      spans.set(`${r1}:${c1}`, { colSpan: c2 - c1 + 1, rowSpan: r2 - r1 + 1 });
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) if (r !== r1 || c !== c1) covered.add(`${r}:${c}`);
      }
    }

    const widths: number[] = [];
    for (let c = 1; c <= colsCount; c++) {
      const w = ws.getColumn(c).width ?? 10;
      widths.push(Math.round(Math.min(Math.max(w, 3), 60) * 7 + 5));
    }
    const rows: PreviewSheet["rows"] = [];
    for (let r = 1; r <= rowsCount; r++) {
      const row = ws.getRow(r);
      const cells: PreviewCell[] = [];
      for (let c = 1; c <= colsCount; c++) {
        const key = `${r}:${c}`;
        if (covered.has(key)) {
          cells.push({ v: "", t: "empty", covered: true });
          continue;
        }
        const cell = cellToPreview(row.getCell(c));
        const span = spans.get(key);
        if (span) {
          if (span.colSpan > 1) cell.colSpan = span.colSpan;
          if (span.rowSpan > 1) cell.rowSpan = span.rowSpan;
        }
        if (opts.limited) {
          if (cell.t === "formula") {
            delete cell.f;
          } else if (cell.t === "number" && r > 6) {
            cell.t = "masked";
            cell.v = "•••";
          }
        }
        cells.push(cell);
      }
      rows.push({ height: Math.round(((row.height as number | undefined) ?? 15) * 1.33), cells });
    }
    sheets.push({
      name: ws.name,
      widths,
      rows,
      totalRows,
      totalCols,
      truncated: totalRows > rowsCount || totalCols > colsCount,
    });
  }
  return { sheets, limited: Boolean(opts.limited) };
}

function colToNum(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
