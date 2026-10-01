import type ExcelJS from "exceljs";

import { toArgb } from "./styles";

/**
 * Formato condicional basado en expresiones: es el tipo que mejor se
 * conserva al abrir el archivo en Google Sheets.
 * Nota: en reglas de formato condicional Excel usa bgColor para el relleno.
 */
export function highlightWhen(
  ws: ExcelJS.Worksheet,
  ref: string,
  formula: string,
  style: { fill?: string; color?: string; bold?: boolean },
  priority?: number,
): void {
  const ruleStyle: Partial<ExcelJS.Style> = {};
  if (style.fill) {
    ruleStyle.fill = { type: "pattern", pattern: "solid", bgColor: { argb: toArgb(style.fill) } };
  }
  if (style.color || style.bold) {
    ruleStyle.font = {
      ...(style.color ? { color: { argb: toArgb(style.color) } } : {}),
      ...(style.bold ? { bold: true } : {}),
    };
  }
  ws.addConditionalFormatting({
    ref,
    rules: [
      {
        type: "expression",
        priority: priority ?? 1,
        formulae: [formula],
        style: ruleStyle,
      },
    ],
  });
}

/** Escala de 3 colores (rojo → ámbar → verde) para porcentajes de avance. */
export function trafficLightScale(ws: ExcelJS.Worksheet, ref: string): void {
  ws.addConditionalFormatting({
    ref,
    rules: [
      {
        type: "colorScale",
        priority: 1,
        cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
        color: [{ argb: "FFF8696B" }, { argb: "FFFFEB84" }, { argb: "FF63BE7B" }],
      },
    ],
  });
}
