import type ExcelJS from "exceljs";

import { rangeAddr, sheetRef } from "./refs";
import { addSheet } from "./sheet";
import { styleHeader, styleInput, type SheetTheme } from "./styles";

export interface ListsRef {
  ws: ExcelJS.Worksheet;
  /** Rango de la lista con filas libres para que el usuario agregue valores */
  source: (key: string) => string;
}

/**
 * Hoja "Listas" con las opciones de los desplegables (categorías, formas de
 * pago, etc.). Cada lista deja filas libres para agregar valores sin tocar
 * las validaciones.
 */
export function addListsSheet(
  wb: ExcelJS.Workbook,
  theme: SheetTheme,
  lists: { key: string; title: string; values: string[]; spare?: number }[],
): ListsRef {
  const ws = addSheet(wb, "Listas", { tabColor: theme.highlight });
  const sources = new Map<string, string>();
  lists.forEach((list, i) => {
    const col = i + 1;
    ws.getColumn(col).width = Math.max(18, list.title.length + 4);
    const h = ws.getCell(1, col);
    h.value = list.title;
    styleHeader(h, theme);
    const spare = list.spare ?? 15;
    const last = 1 + list.values.length + spare;
    for (let r = 2; r <= last; r++) {
      const cell = ws.getCell(r, col);
      cell.value = list.values[r - 2] ?? null;
      styleInput(cell, theme);
    }
    sources.set(list.key, sheetRef(ws.name, rangeAddr(col, 2, col, last, true)));
  });
  return {
    ws,
    source: (key) => {
      const s = sources.get(key);
      if (!s) throw new Error(`Lista desconocida: ${key}`);
      return s;
    },
  };
}
