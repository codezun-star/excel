import type ExcelJS from "exceljs";

/**
 * Estilos base compartidos por todas las plantillas: encabezados verdes,
 * filas cebra, celdas de captura (crema) y celdas calculadas (gris).
 */

export const BRAND_HEX = "#217346";
export const BRAND_DARK_HEX = "#185C37";
export const BRAND_SOFT_HEX = "#E8F3EC";
export const HIGHLIGHT_HEX = "#F2B01E";

const HEX_RE = /^#?([0-9a-f]{6})$/i;

export function normalizeHex(hex: string, fallback = BRAND_HEX): string {
  const m = HEX_RE.exec(hex.trim());
  return m ? `#${m[1]!.toUpperCase()}` : fallback;
}

/** "#217346" → "FF217346" (formato ARGB de ExcelJS) */
export function toArgb(hex: string): string {
  return `FF${normalizeHex(hex).slice(1)}`;
}

function channels(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

/** Mezcla un color con blanco. amount = 0 → mismo color; 1 → blanco. */
export function lighten(hex: string, amount: number): string {
  const [r, g, b] = channels(hex);
  return toHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

/** Mezcla un color con negro. */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = channels(hex);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}

/** Luminancia relativa (WCAG) para elegir texto blanco u oscuro. */
export function isDark(hex: string): boolean {
  const lin = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return lum < 0.4;
}

export interface SheetTheme {
  primary: string;
  primaryDark: string;
  onPrimary: string;
  soft: string;
  zebra: string;
  input: string;
  calc: string;
  total: string;
  border: string;
  text: string;
  muted: string;
  highlight: string;
  danger: string;
  dangerSoft: string;
  warningSoft: string;
  okSoft: string;
}

export function makeTheme(primaryHex: string = BRAND_HEX): SheetTheme {
  const primary = normalizeHex(primaryHex);
  return {
    primary,
    primaryDark: darken(primary, 0.25),
    onPrimary: isDark(primary) ? "#FFFFFF" : "#1B2420",
    soft: lighten(primary, 0.88),
    zebra: lighten(primary, 0.95),
    input: "#FFFBEA",
    calc: "#F3F5F4",
    total: lighten(primary, 0.82),
    border: "#C9D3CE",
    text: "#1B2420",
    muted: "#5B6762",
    highlight: HIGHLIGHT_HEX,
    danger: "#C62828",
    dangerSoft: "#FDE2E1",
    warningSoft: "#FFF1C7",
    okSoft: "#DDF2E4",
  };
}

export const FONT_NAME = "Calibri";

export function solidFill(hex: string): ExcelJS.FillPattern {
  return { type: "pattern", pattern: "solid", fgColor: { argb: toArgb(hex) } };
}

export function thinBorder(hex = "#C9D3CE"): Partial<ExcelJS.Borders> {
  const side: Partial<ExcelJS.Border> = { style: "thin", color: { argb: toArgb(hex) } };
  return { top: side, left: side, bottom: side, right: side };
}

export function font(
  theme: SheetTheme,
  opts: { bold?: boolean; size?: number; color?: string; italic?: boolean } = {},
): Partial<ExcelJS.Font> {
  return {
    name: FONT_NAME,
    size: opts.size ?? 11,
    bold: opts.bold ?? false,
    italic: opts.italic ?? false,
    color: { argb: toArgb(opts.color ?? theme.text) },
  };
}

export function styleHeader(cell: ExcelJS.Cell, theme: SheetTheme): void {
  cell.fill = solidFill(theme.primary);
  cell.font = font(theme, { bold: true, color: theme.onPrimary });
  cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  cell.border = thinBorder(theme.primaryDark);
}

export function styleInput(cell: ExcelJS.Cell, theme: SheetTheme, fill = theme.input): void {
  cell.fill = solidFill(fill);
  cell.font = font(theme);
  cell.border = thinBorder(theme.border);
  cell.protection = { locked: false };
}

export function styleCalc(cell: ExcelJS.Cell, theme: SheetTheme, fill = theme.calc): void {
  cell.fill = solidFill(fill);
  cell.font = font(theme);
  cell.border = thinBorder(theme.border);
  cell.protection = { locked: true };
}

export function styleTotal(cell: ExcelJS.Cell, theme: SheetTheme): void {
  cell.fill = solidFill(theme.total);
  cell.font = font(theme, { bold: true });
  cell.border = thinBorder(theme.primary);
  cell.protection = { locked: true };
}

export function styleLabel(cell: ExcelJS.Cell, theme: SheetTheme, bold = true): void {
  cell.font = font(theme, { bold });
  cell.alignment = { vertical: "middle", wrapText: true };
}

export function styleTitle(cell: ExcelJS.Cell, theme: SheetTheme, size = 18): void {
  cell.font = { ...font(theme, { bold: true, size, color: theme.primaryDark }) };
  cell.alignment = { vertical: "middle" };
}

export function styleNote(cell: ExcelJS.Cell, theme: SheetTheme): void {
  cell.font = font(theme, { italic: true, size: 9, color: theme.muted });
  cell.alignment = { vertical: "top", wrapText: true };
}
