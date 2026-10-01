import type ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { HN } from "@/countries/hn";
import { evaluateWorkbook, type EvaluatedWorkbook } from "@/test/formula-engine";

import { SERVER_TEMPLATES } from "./registry/server";
import { resolveDefaultConfig } from "./types";

/**
 * Verifica resultados concretos de cada plantilla usando sus datos de
 * ejemplo: las fórmulas se evalúan con un motor compatible con Excel.
 */
async function buildExample(slug: string, overrides: Record<string, unknown> = {}) {
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
function valueRightOf(
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

describe("cálculos de plantillas con datos de ejemplo", () => {
  it("reporte-de-ventas: total anual y enero", async () => {
    const { wb, ev } = await buildExample("reporte-de-ventas");
    expect(valueRightOf(wb, ev, "Resumen", "Ventas del año")).toBe(2076);
    expect(valueRightOf(wb, ev, "Resumen", "Enero")).toBe(536);
  });

  it("caja-diaria-arqueo: efectivo esperado y faltante", async () => {
    const { wb, ev } = await buildExample("caja-diaria-arqueo");
    expect(valueRightOf(wb, ev, "Caja", "Efectivo esperado en caja")).toBe(3230);
    expect(valueRightOf(wb, ev, "Arqueo", "Total contado", 1)).toBe(2120);
    expect(valueRightOf(wb, ev, "Arqueo", "Diferencia")).toBe(-1110);
    expect(valueRightOf(wb, ev, "Arqueo", "Resultado")).toBe("Faltante");
  });

  it("cuentas-por-cobrar-pagar: saldos, estados y antigüedad", async () => {
    const { wb, ev } = await buildExample("cuentas-por-cobrar-pagar");
    expect(valueRightOf(wb, ev, "Antigüedad", "Al día (sin vencer)")).toBe(1250);
    expect(valueRightOf(wb, ev, "Antigüedad", "31 a 60 días")).toBe(3000);
    expect(valueRightOf(wb, ev, "Antigüedad", "Total pendiente")).toBe(4250);
  });

  it("estado-de-cuenta-cliente: saldo final", async () => {
    const { wb, ev } = await buildExample("estado-de-cuenta-cliente");
    expect(valueRightOf(wb, ev, "Estado de cuenta", "SALDO FINAL")).toBe(2650);
  });

  it("recibo-de-pago: registro y cantidad en letras", async () => {
    const { wb, ev } = await buildExample("recibo-de-pago");
    expect(valueRightOf(wb, ev, "Registro", "Total recibido")).toBeCloseTo(14350.5, 2);
    expect(valueRightOf(wb, ev, "Recibos", "La cantidad de:")).toBe(
      "MIL OCHOCIENTOS CINCUENTA LEMPIRAS CON 00/100",
    );
  });

  it("libro-de-ventas-y-compras: débito, crédito e ISV a pagar", async () => {
    const { wb, ev } = await buildExample("libro-de-ventas-y-compras");
    expect(valueRightOf(wb, ev, "Resumen ISV", "Total débito fiscal")).toBeCloseTo(2031, 2);
    expect(valueRightOf(wb, ev, "Resumen ISV", "Total crédito fiscal")).toBeCloseTo(1248, 2);
    expect(valueRightOf(wb, ev, "Resumen ISV", "ISV a pagar")).toBeCloseTo(783, 2);
  });

  it("ventas-por-vendedor-comisiones: comisión escalonada", async () => {
    const { wb, ev } = await buildExample("ventas-por-vendedor-comisiones");
    // Ana: 67 000 ≥ 60 000 → 5 % = 3 350; Carlos: 18 000 → 3 % = 540; Lucía: 30 500 → 3 % = 915
    expect(valueRightOf(wb, ev, "Comisiones", "Totales")).toBe(180000);
    const ws = wb.getWorksheet("Comisiones")!;
    let total: unknown;
    ws.eachRow((row) =>
      row.eachCell((c) => {
        if (c.value === "Totales")
          total = ev.value("Comisiones", ws.getCell(Number(c.row), 6).address);
      }),
    );
    expect(total).toBeCloseTo(4805, 2);
  });
});
