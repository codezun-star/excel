import { describe, expect, it } from "vitest";

import { HN } from "@/countries/hn";
import template from "@/templates/facturacion/factura-con-isv";
import { resolveDefaultConfig } from "@/templates/types";

import { workbookToPreview } from "./preview";

describe("vista previa del workbook", () => {
  it("muestra las hojas visibles con fórmulas marcadas y celdas combinadas", async () => {
    const wb = await template.build(
      { ...resolveDefaultConfig(template, HN), businessName: "Mi Negocio", example: true },
      HN,
    );
    const data = workbookToPreview(wb);
    expect(data.sheets.map((s) => s.name)).toEqual([
      "Factura",
      "Parámetros",
      "Listas",
      "Instrucciones",
    ]);
    const factura = data.sheets[0]!;
    const cells = factura.rows.flatMap((r) => r.cells);
    expect(cells.some((c) => c.v === "Mi Negocio" && (c.colSpan ?? 1) > 1)).toBe(true);
    expect(cells.some((c) => c.t === "formula" && c.f?.startsWith("="))).toBe(true);
    expect(cells.some((c) => c.v === "L 350.00")).toBe(true);
  });

  it("la vista limitada oculta fórmulas y montos", async () => {
    const wb = await template.build({ ...resolveDefaultConfig(template, HN), example: true }, HN);
    const data = workbookToPreview(wb, { limited: true, limitedRows: 20 });
    const cells = data.sheets[0]!.rows.flatMap((r) => r.cells);
    expect(data.limited).toBe(true);
    expect(cells.every((c) => c.t !== "formula" || !c.f)).toBe(true);
    expect(cells.some((c) => c.t === "masked")).toBe(true);
    expect(data.sheets[0]!.rows.length).toBeLessThanOrEqual(20);
  });
});
