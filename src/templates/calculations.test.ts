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

/**
 * Devuelve los valores calculados de la fila que contiene `rowKey`, con las
 * claves tomadas de la fila de encabezados (la que contiene `headerLabel`).
 */
function tableRow(
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
      if (headerRow && n > headerRow && !keyRow && cell.value === rowKey) keyRow = n;
    });
  });
  if (!headerRow || !keyRow) throw new Error(`No se encontró la fila "${rowKey}" en ${sheet}`);
  const out: Record<string, unknown> = {};
  ws.getRow(headerRow).eachCell((cell, col) => {
    out[String(cell.value).replace(/\n/g, " ")] = ev.value(sheet, ws.getCell(keyRow, col).address);
  });
  return out;
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

  it("planilla-de-sueldos: IHSS con techo, RAP sobre excedente e ISR por tramos", async () => {
    const { wb, ev } = await buildExample("planilla-de-sueldos");
    const maria = tableRow(wb, ev, "Planilla", "Empleado", "María José Flores");
    expect(maria["Total devengado"]).toBe(14000);
    expect(maria["IHSS Enfermedad y Maternidad"]).toBeCloseTo(297.58, 2);
    expect(maria["IHSS Invalidez, Vejez y Muerte"]).toBeCloseTo(297.58, 2);
    expect(maria["RAP (aportación sobre excedente del techo IHSS)"]).toBeCloseTo(31.45, 2);
    expect(maria["Retención ISR"]).toBe(0);
    expect(maria["Neto a pagar"]).toBeCloseTo(13373.39, 2);

    const jose = tableRow(wb, ev, "Planilla", "Empleado", "José Ramón Castillo");
    expect(jose["Renta neta anual estimada"]).toBe(980000);
    expect(jose["Retención ISR"]).toBeCloseTo(12738.38, 2);
    expect(jose["Neto a pagar"]).toBeCloseTo(70570.01, 2);
  });

  it("decimo-tercer-y-cuarto-mes: completos y proporcionales (base 360)", async () => {
    const { wb, ev } = await buildExample("decimo-tercer-y-cuarto-mes");
    const carlos = tableRow(wb, ev, "Décimos", "Empleado", "Carlos Antonio Reyes");
    expect(carlos["Décimo tercer mes (aguinaldo)"]).toBeCloseTo(11400, 2);
    expect(carlos["Décimo cuarto mes"]).toBeCloseTo(3800, 2);
    const jose = tableRow(wb, ev, "Décimos", "Empleado", "José Ramón Castillo");
    expect(jose["Décimo tercer mes (aguinaldo)"]).toBeCloseTo(21250, 2);
    expect(jose["Décimo cuarto mes"]).toBeCloseTo(63750, 2);
    expect(valueRightOf(wb, ev, "Décimos", "Totales")).toBeTruthy();
    const ws = wb.getWorksheet("Décimos")!;
    let total: unknown;
    ws.eachRow((row) =>
      row.eachCell((c) => {
        if (c.value === "Totales")
          total = ev.value("Décimos", ws.getCell(Number(c.row), ws.columnCount).address);
      }),
    );
    expect(total).toBeCloseTo(193700, 2);
  });

  it("prestaciones-laborales: preaviso, cesantía, vacaciones y décimos", async () => {
    const { wb, ev } = await buildExample("prestaciones-laborales");
    const v = (label: string) => valueRightOf(wb, ev, "Prestaciones", label);
    expect(v("Tiempo de servicio (días, base 360)")).toBe(1906);
    expect(v("Preaviso")).toBeCloseTo(37000, 2);
    expect(v("Auxilio de cesantía")).toBeCloseTo(97947.22, 2);
    expect(v("Vacaciones proporcionales")).toBeCloseTo(3533.33, 2);
    expect(v("Décimo tercer mes (aguinaldo) proporcional")).toBeCloseTo(9000, 2);
    expect(v("Décimo cuarto mes proporcional")).toBeCloseTo(18000, 2);
    expect(v("TOTAL A PAGAR")).toBeCloseTo(177480.55, 2);
  });

  it("horas-extra: valor hora por jornada y recargos", async () => {
    const { wb, ev } = await buildExample("horas-extra");
    expect(valueRightOf(wb, ev, "Resumen", "Total a pagar")).toBeCloseTo(650, 2);
  });

  it("salario-minimo: verificador contra la tabla", async () => {
    const { wb, ev } = await buildExample("salario-minimo");
    expect(tableRow(wb, ev, "Verificador", "Empleado", "Pedro Gómez")["¿Cumple?"]).toBe("Sí");
    const lucia = tableRow(wb, ev, "Verificador", "Empleado", "Lucía Paz");
    expect(lucia["Salario mínimo"]).toBeCloseTo(13527.23, 2);
    expect(lucia["¿Cumple?"]).toBe("No");
    expect(tableRow(wb, ev, "Verificador", "Empleado", "Mario Ruiz")["¿Cumple?"]).toBe("Sí");
  });

  it("control-de-vacaciones: días ganados, tomados y pendientes", async () => {
    const { wb, ev } = await buildExample("control-de-vacaciones");
    const maria = tableRow(wb, ev, "Saldos", "Empleado", "María José Flores");
    expect(Number(maria["Años cumplidos"])).toBeGreaterThanOrEqual(7);
    expect(maria["Días tomados"]).toBe(10);
    expect(Number(maria["Días pendientes"])).toBe(Number(maria["Días ganados"]) - 10);
  });

  it("control-de-asistencia: conteos por código", async () => {
    const { wb, ev } = await buildExample("control-de-asistencia");
    const row = tableRow(wb, ev, "Asistencia", "Empleado", "Empleado 2");
    expect(row["A"]).toBe(1);
    expect(row["T"]).toBe(1);
    expect(row["F"]).toBe(2);
    expect(row["% asistencia"]).toBeCloseTo(7 / 8, 4);
  });

  it("horarios-y-turnos: horas netas y exceso con turno nocturno", async () => {
    const { wb, ev } = await buildExample("horarios-y-turnos");
    // 5 días de 9 h + sábado de 4 h − 1 h de descanso por día (6 días) = 43 h
    expect(tableRow(wb, ev, "Horario", "Empleado", "Empleado 1")["Horas netas"]).toBeCloseTo(43, 4);
    // Turno nocturno 22:00–04:00 × 5 días − 5 h de descanso = 25 h (máximo 36)
    const night = tableRow(wb, ev, "Horario", "Empleado", "Empleado 3");
    expect(night["Horas netas"]).toBeCloseTo(25, 4);
    expect(night["Exceso"]).toBe(0);
  });

  it("boleta-de-pago: neto igual a la planilla", async () => {
    const { wb, ev } = await buildExample("boleta-de-pago");
    expect(tableRow(wb, ev, "Datos", "Empleado", "María José Flores")["Neto a pagar"]).toBeCloseTo(
      12880.89,
      2,
    );
  });
});
