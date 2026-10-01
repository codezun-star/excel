import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

import { addSheet } from "./sheet";
import { font, solidFill, styleNote, styleTitle, thinBorder, type SheetTheme } from "./styles";
import { SITE_HOST, SITE_NAME, type BuildOptions } from "./workbook";

export interface InstructionsOptions {
  title: string;
  description: string;
  steps: string[];
  sheets?: { name: string; description: string }[];
  tips?: string[];
  ctx: CountryContext;
  theme: SheetTheme;
  options: BuildOptions;
  /** Plantillas fiscales o laborales muestran aviso legal y fecha de revisión */
  regulated?: "fiscal" | "laboral";
}

export const LEGAL_DISCLAIMER =
  "Las plantillas fiscales y laborales son herramientas de apoyo y no sustituyen la asesoría de un contador o abogado. Verifica siempre los valores vigentes con las fuentes oficiales.";

/** Hoja "Instrucciones" presente en todos los archivos generados. */
export function addInstructionsSheet(
  wb: ExcelJS.Workbook,
  opts: InstructionsOptions,
): ExcelJS.Worksheet {
  const { theme, ctx } = opts;
  const ws = addSheet(wb, "Instrucciones", { tabColor: theme.highlight, showGridLines: false });
  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 6;
  ws.getColumn(3).width = 96;

  let row = 2;
  const title = ws.getCell(row, 2);
  title.value = opts.title;
  styleTitle(title, theme, 20);
  ws.mergeCells(row, 2, row, 3);
  row++;

  const desc = ws.getCell(row, 2);
  desc.value = opts.description;
  desc.font = font(theme, { color: theme.muted });
  desc.alignment = { wrapText: true, vertical: "top" };
  ws.mergeCells(row, 2, row, 3);
  ws.getRow(row).height = 34;
  row += 2;

  const section = (label: string) => {
    const cell = ws.getCell(row, 2);
    cell.value = label;
    cell.font = font(theme, { bold: true, size: 13, color: theme.primaryDark });
    ws.mergeCells(row, 2, row, 3);
    row++;
  };

  section("Cómo usar este archivo");
  opts.steps.forEach((step, i) => {
    const n = ws.getCell(row, 2);
    n.value = i + 1;
    n.font = font(theme, { bold: true, color: theme.onPrimary });
    n.fill = solidFill(theme.primary);
    n.alignment = { horizontal: "center", vertical: "middle" };
    const t = ws.getCell(row, 3);
    t.value = step;
    t.alignment = { wrapText: true, vertical: "middle" };
    t.font = font(theme);
    ws.getRow(row).height = step.length > 95 ? 32 : 20;
    row++;
  });
  row++;

  section("Colores de las celdas");
  const legend: [string, string][] = [
    [theme.input, "Crema: datos que debes escribir (configuración y encabezados)."],
    ["#FFFFFF", "Blanco o con franjas: filas de captura de tus registros."],
    [theme.calc, "Gris: se calcula automáticamente. No la edites."],
    [theme.total, "Verde claro: totales y resultados."],
  ];
  for (const [color, text] of legend) {
    const swatch = ws.getCell(row, 2);
    swatch.fill = solidFill(color);
    swatch.border = thinBorder(theme.border);
    const t = ws.getCell(row, 3);
    t.value = text;
    t.font = font(theme);
    row++;
  }
  row++;

  if (opts.sheets?.length) {
    section("Hojas del archivo");
    for (const s of opts.sheets) {
      const t = ws.getCell(row, 3);
      t.value = {
        richText: [{ text: `${s.name}: `, font: { bold: true } }, { text: s.description }],
      };
      t.alignment = { wrapText: true, vertical: "top" };
      ws.mergeCells(row, 2, row, 3);
      ws.getRow(row).height = s.description.length > 90 ? 32 : 18;
      row++;
    }
    row++;
  }

  const tips = [
    ...(opts.tips ?? []),
    "Las hojas están protegidas sin contraseña para evitar borrar fórmulas por accidente. Si necesitas modificarlas: Revisar → Desproteger hoja.",
    "Funciona en Microsoft Excel (2010 o superior), Google Sheets y LibreOffice.",
  ];
  section("Consejos");
  for (const tip of tips) {
    const t = ws.getCell(row, 3);
    t.value = `• ${tip}`;
    t.alignment = { wrapText: true, vertical: "top" };
    t.font = font(theme);
    ws.mergeCells(row, 2, row, 3);
    ws.getRow(row).height = tip.length > 95 ? 32 : 18;
    row++;
  }
  row++;

  if (opts.regulated) {
    section("Aviso legal");
    const legal = ws.getCell(row, 2);
    legal.value =
      `${LEGAL_DISCLAIMER} Reglas de ${ctx.name} versión ${ctx.rulesVersion}, ` +
      `última revisión ${ctx.lastReviewed}.` +
      (ctx.reviewStatus === "pending"
        ? " Los valores están pendientes de verificación con fuentes oficiales."
        : "");
    legal.font = font(theme, { size: 10 });
    legal.fill = solidFill(theme.warningSoft);
    legal.alignment = { wrapText: true, vertical: "top" };
    ws.mergeCells(row, 2, row, 3);
    ws.getRow(row).height = 48;
    row += 2;
  }

  const credit = ws.getCell(row, 2);
  if (opts.options.branding?.name) {
    credit.value = opts.options.branding.footer ?? `Preparado por ${opts.options.branding.name}`;
    styleNote(credit, theme);
  } else if (opts.options.watermark) {
    credit.value = `Hecho con ${SITE_NAME} · ${SITE_HOST}`;
    styleNote(credit, theme);
  }
  ws.mergeCells(row, 2, row, 3);

  return ws;
}
