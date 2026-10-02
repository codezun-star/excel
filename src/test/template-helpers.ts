import type ExcelJS from "exceljs";

import { HN } from "@/countries/hn";
import { SERVER_TEMPLATES } from "@/templates/registry/server";
import { resolveDefaultConfig } from "@/templates/types";

import { evaluateWorkbook, type EvaluatedWorkbook } from "./formula-engine";

/**
 * Verifica resultados concretos de cada plantilla usando sus datos de
 * ejemplo: las fórmulas se evalúan con un motor compatible con Excel.
 */
export async function buildExample(slug: string, overrides: Record<string, unknown> = {}) {
  const loader = SERVER_TEMPLATES[slug];
  if (!loader) throw new Error(`Plantilla no registrada: ${slug}`);
  const t = await loader();
  const config = t.configSchema.parse({
    ...resolveDefaultConfig(t, HN),
    example: true,
    ...overrides,
  });
  const wb = await t.build(config, HN, { watermark: true });
  return { wb, ev: evaluateWorkbook(wb) };
}

/** Valor calculado a la derecha de una etiqueta (primera celda con fórmula o valor). */
export function valueRightOf(
  wb: ExcelJS.Workbook,
  ev: EvaluatedWorkbook,
  sheet: string,
  label: string,
  occurrence = 0,
): unknown {
  const ws = wb.getWorksheet(sheet);
  if (!ws) throw new Error(`Hoja inexistente: ${sheet}`);
  const hits: ExcelJS.Cell[] = [];
  ws.eachRow((row) =>
    row.eachCell((cell) => {
      const isMaster = !cell.isMerged || cell.master.address === cell.address;
      if (isMaster && cell.value === label) hits.push(cell);
    }),
  );
  const hit = hits[occurrence];
  if (!hit) throw new Error(`No se encontró "${label}" en ${sheet}`);
  const row = ws.getRow(Number(hit.row));
  for (let c = Number(hit.col) + 1; c <= ws.columnCount; c++) {
    const cell = row.getCell(c);
    if (cell.isMerged && cell.master.address !== cell.address) continue;
    if (cell.value !== null && cell.value !== undefined) return ev.value(sheet, cell.address);
  }
  throw new Error(`Sin valor a la derecha de "${label}"`);
}

/**
 * Devuelve los valores calculados de la fila que contiene `rowKey`, con las
 * claves tomadas de la fila de encabezados (la que contiene `headerLabel`).
 */
export function tableRow(
  wb: ExcelJS.Workbook,
  ev: EvaluatedWorkbook,
  sheet: string,
  headerLabel: string,
  rowKey: string,
): Record<string, unknown> {
  const ws = wb.getWorksheet(sheet);
  if (!ws) throw new Error(`Hoja inexistente: ${sheet}`);
  let headerRow = 0;
  let keyRow = 0;
  ws.eachRow((row, n) => {
    row.eachCell((cell) => {
      if (!headerRow && cell.value === headerLabel) headerRow = n;
      if (headerRow && n > headerRow && !keyRow) {
        const v = cell.value;
        const shown =
          v && typeof v === "object" && "formula" in v ? ev.value(sheet, cell.address) : v;
        if (shown === rowKey) keyRow = n;
      }
    });
  });
  if (!headerRow || !keyRow) throw new Error(`No se encontró la fila "${rowKey}" en ${sheet}`);
  const out: Record<string, unknown> = {};
  ws.getRow(headerRow).eachCell((cell, col) => {
    out[String(cell.value).replace(/\n/g, " ")] = ev.value(sheet, ws.getCell(keyRow, col).address);
  });
  return out;
}
