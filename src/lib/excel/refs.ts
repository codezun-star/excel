/**
 * Utilidades para construir referencias de celdas y rangos como texto.
 * Todas las fórmulas se escriben en sintaxis de Excel (en inglés, separador
 * coma), que es la que guardan los .xlsx y entienden Excel y Google Sheets.
 */

/** 1 → A, 27 → AA */
export function colLetter(col: number): string {
  if (!Number.isInteger(col) || col < 1) throw new Error(`Columna inválida: ${col}`);
  let n = col;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** A → 1, AA → 27 */
export function colNumber(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    const code = ch.charCodeAt(0);
    if (code < 65 || code > 90) throw new Error(`Letra de columna inválida: ${letters}`);
    n = n * 26 + (code - 64);
  }
  return n;
}

export interface AddrOptions {
  absCol?: boolean;
  absRow?: boolean;
}

/** addr(2, 5) → "B5"; addr(2, 5, { absCol: true, absRow: true }) → "$B$5" */
export function addr(col: number, row: number, opts: AddrOptions = {}): string {
  return `${opts.absCol ? "$" : ""}${colLetter(col)}${opts.absRow ? "$" : ""}${row}`;
}

export function absAddr(col: number, row: number): string {
  return addr(col, row, { absCol: true, absRow: true });
}

export function rangeAddr(
  col1: number,
  row1: number,
  col2: number,
  row2: number,
  absolute = false,
): string {
  const o = absolute ? { absCol: true, absRow: true } : {};
  return `${addr(col1, row1, o)}:${addr(col2, row2, o)}`;
}

/** Siempre entre comillas simples para soportar espacios y acentos. */
export function quoteSheet(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

/** sheetRef("Parámetros", "$B$3") → "'Parámetros'!$B$3" */
export function sheetRef(sheetName: string, address: string): string {
  return `${quoteSheet(sheetName)}!${address}`;
}

/** Escapa un texto para usarlo como literal dentro de una fórmula. */
export function formulaString(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Desplaza una celda: offsetCell("C9", 1) → "D9"; conserva los "$". */
export function offsetCell(cell: string, colOffset: number, rowOffset = 0): string {
  const m = /^(\$?)([A-Z]+)(\$?)(\d+)$/.exec(cell);
  if (!m) throw new Error(`Celda inválida: ${cell}`);
  return `${m[1]}${colLetter(colNumber(m[2]!) + colOffset)}${m[3]}${Number(m[4]) + rowOffset}`;
}

/** Desplaza un rango "C9:C20" columnas a la derecha (o izquierda si es negativo). */
export function offsetRange(range: string, colOffset: number, rowOffset = 0): string {
  return range
    .split(":")
    .map((c) => offsetCell(c, colOffset, rowOffset))
    .join(":");
}
