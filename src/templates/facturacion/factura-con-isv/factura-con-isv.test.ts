import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { HN } from "@/countries/hn";
import type { CountryContext } from "@/countries/types";
import { amountToWords } from "@/lib/excel/amount-in-words";
import { getValidations } from "@/lib/excel/validation";
import { evaluateWorkbook, splitRef } from "@/test/formula-engine";
import { resolveDefaultConfig } from "@/templates/types";

import template from "./index";
import { configSchema, type FacturaConfig } from "./form";

const base = (): FacturaConfig => ({
  ...resolveDefaultConfig(template, HN),
  businessName: "Comercial La Esperanza",
  taxId: "0801-1990-123456",
  cai: "ABC123-DEF456",
  rangeFrom: 1,
  rangeTo: 500,
  deadline: "2027-06-30",
});

async function buildWith(config: FacturaConfig, ctx: CountryContext = HN) {
  const wb = await template.build(configSchema.parse(config), ctx);
  return wb;
}

function formulaOf(ws: ExcelJS.Worksheet, address: string): string | undefined {
  const v = ws.getCell(address).value;
  return v && typeof v === "object" && "formula" in v ? v.formula : undefined;
}

/** Busca la fila de encabezado de la tabla de líneas (la que dice "Descripción"). */
function findHeader(ws: ExcelJS.Worksheet): { row: number; cols: Record<string, number> } {
  for (let r = 1; r <= 60; r++) {
    const cols: Record<string, number> = {};
    ws.getRow(r).eachCell((cell, c) => {
      if (typeof cell.value === "string") cols[cell.value] = c;
    });
    if (cols["Descripción"] && cols["Cantidad"]) return { row: r, cols };
  }
  throw new Error("No se encontró la tabla de líneas");
}

function findTotal(ws: ExcelJS.Worksheet, label: string): string {
  let found: string | null = null;
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.value === label) {
        const lastCol = ws.columnCount;
        found = ws.getCell(cell.row, lastCol).address;
      }
    });
  });
  if (!found) throw new Error(`No se encontró el total "${label}"`);
  return found;
}

describe("factura-con-isv", () => {
  it("genera las hojas esperadas", async () => {
    const wb = await buildWith(base());
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      "Factura",
      "Parámetros",
      "Listas",
      "Letras",
      "Instrucciones",
    ]);
    expect(wb.getWorksheet("Letras")?.state).toBe("hidden");
    expect(wb.calcProperties.fullCalcOnLoad).toBe(true);
  });

  it("escribe fórmulas reales en cada línea", async () => {
    const wb = await buildWith(base());
    const ws = wb.getWorksheet("Factura")!;
    const { row, cols } = findHeader(ws);
    const first = row + 1;
    const sub = ws.getCell(first, cols["Subtotal"]!).address;
    const tax = ws.getCell(first, cols["ISV"]!).address;
    const total = ws.getCell(first, cols["Total"]!).address;
    expect(formulaOf(ws, sub)).toMatch(/ROUND\(.+\*.+-.+,2\)/);
    expect(formulaOf(ws, tax)).toContain("VLOOKUP(");
    expect(formulaOf(ws, total)).toContain("+");
    // La tasa de ISV de cada línea es una lista desplegable desde Parámetros
    const validations = Object.values(getValidations(ws));
    expect(
      validations.some((v) => v.type === "list" && String(v.formulae[0]).includes("Parámetros")),
    ).toBe(true);
  });

  it("no escribe tasas legales dentro de las fórmulas", async () => {
    const wb = await buildWith(base());
    wb.eachSheet((ws) => {
      ws.eachRow((r) =>
        r.eachCell((cell) => {
          const v = cell.value;
          if (v && typeof v === "object" && "formula" in v) {
            expect(v.formula).not.toMatch(/0\.15|0\.18|15%|18%/);
          }
        }),
      );
    });
  });

  it("calcula subtotales, ISV por tasa, total y total en letras", async () => {
    const wb = await buildWith(base());
    const ws = wb.getWorksheet("Factura")!;
    const { row, cols } = findHeader(ws);
    const r1 = row + 1;
    const set = (r: number, header: string, value: ExcelJS.CellValue) => {
      ws.getCell(r, cols[header]!).value = value;
    };
    set(r1, "Descripción", "Producto gravado 15");
    set(r1, "Cantidad", 2);
    set(r1, "Precio unitario", 100);
    set(r1, "Descuento", 10);
    set(r1, "Tipo ISV", "ISV 15%");
    set(r1 + 1, "Descripción", "Bebida 18");
    set(r1 + 1, "Cantidad", 1);
    set(r1 + 1, "Precio unitario", 50);
    set(r1 + 1, "Tipo ISV", "ISV 18%");
    set(r1 + 2, "Descripción", "Producto exento");
    set(r1 + 2, "Cantidad", 3);
    set(r1 + 2, "Precio unitario", 20);
    set(r1 + 2, "Tipo ISV", "Exento");

    const ev = evaluateWorkbook(wb);
    const v = (label: string) => ev.value("Factura", findTotal(ws, label));
    expect(ev.errors()).toEqual([]);
    expect(v("Descuentos y rebajas otorgados")).toBe(10);
    expect(v("Subtotal")).toBe(300);
    expect(v("TOTAL A PAGAR")).toBeCloseTo(337.5, 2);

    // Desglose por tasa (las etiquetas son fórmulas: buscamos por valor calculado)
    const totalsByLabel: Record<string, unknown> = {};
    const lastCol = ws.columnCount;
    for (let r = row; r <= row + 60; r++) {
      const labelCell = ws.getCell(r, lastCol - 2);
      const lv = labelCell.value;
      if (lv && typeof lv === "object" && "formula" in lv) {
        totalsByLabel[String(ev.value("Factura", labelCell.address))] = ev.value(
          "Factura",
          ws.getCell(r, lastCol).address,
        );
      }
    }
    expect(totalsByLabel["Importe Exento"]).toBe(60);
    expect(totalsByLabel["Importe gravado ISV 15%"]).toBe(190);
    expect(totalsByLabel["Importe gravado ISV 18%"]).toBe(50);
    expect(totalsByLabel["ISV 15%"]).toBeCloseTo(28.5, 2);
    expect(totalsByLabel["ISV 18%"]).toBeCloseTo(9, 2);

    // Total en letras
    let words: unknown = null;
    ws.eachRow((r) =>
      r.eachCell((cell) => {
        const val = cell.value;
        const isMaster = !cell.isMerged || cell.master.address === cell.address;
        if (
          isMaster &&
          val &&
          typeof val === "object" &&
          "formula" in val &&
          val.formula?.includes("Letras")
        ) {
          words = ev.value("Factura", cell.address);
        }
      }),
    );
    expect(words).toBe("TRESCIENTOS TREINTA Y SIETE LEMPIRAS CON 50/100");
  });

  it("arma el número de factura con prefijo y correlativo", async () => {
    const wb = await buildWith({ ...base(), startNumber: 42 });
    const ev = evaluateWorkbook(wb);
    const ws = wb.getWorksheet("Factura")!;
    let numberValue: unknown;
    ws.eachRow((r) =>
      r.eachCell((cell) => {
        if (cell.value === "N.º")
          numberValue = ev.value("Factura", ws.getCell(cell.row, cell.col + 1).address);
      }),
    );
    expect(numberValue).toBe("000-001-01-00000042");
  });

  it("toma las tasas del módulo del país", async () => {
    const custom: CountryContext = {
      ...HN,
      taxes: {
        ...HN.taxes,
        salesTax: {
          ...HN.taxes.salesTax,
          rates: HN.taxes.salesTax.rates.map((r) =>
            r.id === "standard" ? { ...r, rate: 0.12, label: "ISV 12%" } : r,
          ),
        },
      },
    };
    const wb = await buildWith({ ...base(), example: true }, custom);
    const ws = wb.getWorksheet("Factura")!;
    const ev = evaluateWorkbook(wb);
    expect(ev.errors()).toEqual([]);
    // Ejemplo: 2 × 350 − 20 = 680 al 12 % → 81.60
    const { row, cols } = findHeader(ws);
    expect(ev.value("Factura", ws.getCell(row + 1, cols["ISV"]!).address)).toBeCloseTo(81.6, 2);
  });

  it("omite la columna de descuento si no se elige", async () => {
    const wb = await buildWith({ ...base(), optionalColumns: [] });
    const ws = wb.getWorksheet("Factura")!;
    const { cols } = findHeader(ws);
    expect(cols["Descuento"]).toBeUndefined();
    expect(cols["Código"]).toBeUndefined();
  });

  it("los datos de ejemplo no producen errores y sobreviven a guardar y abrir", async () => {
    const wb = await buildWith({
      ...base(),
      example: true,
      optionalColumns: ["code", "unit", "discount"],
      exemptionFields: true,
    });
    expect(evaluateWorkbook(wb).errors()).toEqual([]);
    const buffer = await wb.xlsx.writeBuffer();
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(buffer);
    const ws = reopened.getWorksheet("Factura")!;
    const { row, cols } = findHeader(ws);
    expect(formulaOf(ws, ws.getCell(row + 1, cols["Total"]!).address)).toBeTruthy();
    expect(evaluateWorkbook(reopened).errors()).toEqual([]);
  });

  it("valida la configuración", () => {
    expect(configSchema.safeParse({ ...base(), color: "verde" }).success).toBe(false);
    expect(configSchema.safeParse({ ...base(), lines: 500 }).success).toBe(false);
    expect(configSchema.safeParse({ ...base(), rangeFrom: "" }).success).toBe(true);
  });
});

describe("monto en letras", () => {
  it.each([
    [1, "UN LEMPIRA CON 00/100"],
    [21_000, "VEINTIÚN MIL LEMPIRAS CON 00/100"],
    [1_000_000, "UN MILLÓN DE LEMPIRAS CON 00/100"],
    [2_500_000.75, "DOS MILLONES QUINIENTOS MIL LEMPIRAS CON 75/100"],
    [101.1, "CIENTO UN LEMPIRAS CON 10/100"],
    [0.5, "CERO LEMPIRAS CON 50/100"],
  ])("%d → %s", (value, expected) => {
    expect(amountToWords(value, HN)).toBe(expected);
  });

  it("la fórmula de Excel coincide con la versión JavaScript", async () => {
    const wb = await buildWith({ ...base(), optionalColumns: [] });
    const ws = wb.getWorksheet("Factura")!;
    const { row, cols } = findHeader(ws);
    const values = [1, 21_000, 1_000_000, 987_654.32, 100];
    for (const value of values) {
      ws.getCell(row + 1, cols["Descripción"]!).value = "x";
      ws.getCell(row + 1, cols["Cantidad"]!).value = 1;
      ws.getCell(row + 1, cols["Precio unitario"]!).value = value;
      ws.getCell(row + 1, cols["Tipo ISV"]!).value = "Exento";
      const ev = evaluateWorkbook(wb);
      let words: unknown;
      ws.eachRow((r) =>
        r.eachCell((cell) => {
          const val = cell.value;
          if (
            val &&
            typeof val === "object" &&
            "formula" in val &&
            val.formula?.includes("Letras")
          ) {
            const [sheet, address] = splitRef(val.formula ?? "");
            words = ev.value(sheet, address);
          }
        }),
      );
      expect(words).toBe(amountToWords(value, HN));
    }
  });
});
