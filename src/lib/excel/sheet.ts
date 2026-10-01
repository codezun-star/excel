import type ExcelJS from "exceljs";

import { safeSheetName } from "./sheet-names";
import { toArgb } from "./styles";

export interface AddSheetOptions {
  tabColor?: string;
  landscape?: boolean;
  /** Filas a congelar en la parte superior */
  freezeRows?: number;
  freezeCols?: number;
  /** "Letter" (Carta, habitual en Honduras) o "A4" */
  paper?: "letter" | "a4";
  hidden?: boolean;
  showGridLines?: boolean;
}

/** Crea una hoja con nombre seguro, vista y configuración de impresión. */
export function addSheet(
  wb: ExcelJS.Workbook,
  name: string,
  opts: AddSheetOptions = {},
): ExcelJS.Worksheet {
  const safeName = safeSheetName(
    name,
    wb.worksheets.map((w) => w.name),
  );
  const ws = wb.addWorksheet(safeName, {
    properties: { tabColor: opts.tabColor ? { argb: toArgb(opts.tabColor) } : undefined },
    views: [
      {
        state: opts.freezeRows || opts.freezeCols ? "frozen" : "normal",
        xSplit: opts.freezeCols ?? 0,
        ySplit: opts.freezeRows ?? 0,
        showGridLines: opts.showGridLines ?? true,
      },
    ],
    pageSetup: {
      // Sin paperSize Excel usa Carta (Letter); 9 = A4.
      paperSize: opts.paper === "a4" ? (9 as ExcelJS.PaperSize) : undefined,
      orientation: opts.landscape ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    },
  });
  if (opts.hidden) ws.state = "hidden";
  return ws;
}

/**
 * Protege la hoja SIN contraseña: evita borrar fórmulas por accidente, pero
 * cualquiera puede desprotegerla desde Revisar → Desproteger hoja.
 * Las celdas de captura deben tener protection.locked = false.
 */
export async function protectSheet(ws: ExcelJS.Worksheet): Promise<void> {
  await ws.protect("", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatColumns: true,
    formatRows: true,
    sort: true,
    autoFilter: true,
    insertRows: false,
    deleteRows: false,
  });
}

export function setColumnWidths(ws: ExcelJS.Worksheet, widths: number[], startCol = 1): void {
  widths.forEach((w, i) => {
    ws.getColumn(startCol + i).width = w;
  });
}
