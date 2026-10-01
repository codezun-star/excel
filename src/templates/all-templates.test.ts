import { describe, expect, it } from "vitest";

import { HN } from "@/countries/hn";
import type { CountryContext } from "@/countries/types";
import { evaluateWorkbook } from "@/test/formula-engine";

import { SERVER_TEMPLATES } from "./registry/server";
import { resolveDefaultConfig } from "./types";

/** Números legales del país que nunca deben aparecer escritos dentro de una fórmula. */
function legalNumbers(ctx: CountryContext): number[] {
  const values = new Set<number>();
  ctx.taxes.salesTax.rates.forEach((r) => values.add(r.rate));
  ctx.taxes.socialSecurity.forEach((s) => {
    values.add(s.employeeRate);
    values.add(s.employerRate);
    if (s.ceiling) values.add(s.ceiling);
    if (s.referenceCeiling) values.add(s.referenceCeiling);
  });
  ctx.taxes.employerOnly.forEach((e) => values.add(e.rate));
  ctx.taxes.incomeTax.brackets.forEach((b) => {
    values.add(b.rate);
    values.add(b.from);
    if (b.to) values.add(b.to);
  });
  ctx.taxes.incomeTax.standardDeductions.forEach((d) => values.add(d.amount));
  ctx.labor.overtime.forEach((o) => values.add(o.surcharge));
  ctx.labor.minimumWage.table.forEach((row) =>
    row.monthly.forEach((m) => {
      if (m.amount) values.add(m.amount);
    }),
  );
  values.add(ctx.labor.minimumWage.averageMonthly);
  return [...values].filter((v) => v !== 0 && v !== 1 && v !== 0.5);
}

function containsNumber(formula: string, n: number): boolean {
  const literal = String(n).replace(".", "\\.");
  return new RegExp(`(?<![\\d.$A-Z])${literal}(?![\\d])`).test(formula);
}

const slugs = Object.keys(SERVER_TEMPLATES);

describe.each(slugs)("plantilla %s", (slug) => {
  it("se genera con la configuración por defecto y con datos de ejemplo sin errores de fórmula", async () => {
    const template = await SERVER_TEMPLATES[slug]!();
    const defaults = resolveDefaultConfig(template, HN);
    expect(template.configSchema.safeParse(defaults).success).toBe(true);

    for (const example of [false, true]) {
      const config = template.configSchema.parse({ ...defaults, example });
      const wb = await template.build(config, HN, { watermark: true });
      const names = wb.worksheets.map((w) => w.name);
      expect(names).toContain("Instrucciones");
      expect(wb.calcProperties.fullCalcOnLoad).toBe(true);
      const ev = evaluateWorkbook(wb);
      expect(ev.formulaCount()).toBeGreaterThan(0);
      expect(ev.errors()).toEqual([]);
    }
  });

  it("no escribe valores legales del país dentro de las fórmulas", async () => {
    const template = await SERVER_TEMPLATES[slug]!();
    const config = template.configSchema.parse({
      ...resolveDefaultConfig(template, HN),
      example: true,
    });
    const wb = await template.build(config, HN, { watermark: true });
    const numbers = legalNumbers(HN);
    const offenders: string[] = [];
    wb.eachSheet((ws) =>
      ws.eachRow((row) =>
        row.eachCell((cell) => {
          const v = cell.value;
          if (v && typeof v === "object" && "formula" in v && v.formula) {
            for (const n of numbers) {
              if (containsNumber(v.formula, n))
                offenders.push(`${ws.name}!${cell.address}: ${n} en ${v.formula}`);
            }
          }
        }),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it("sobrevive a guardar y volver a abrir el archivo", async () => {
    const template = await SERVER_TEMPLATES[slug]!();
    const config = template.configSchema.parse({
      ...resolveDefaultConfig(template, HN),
      example: true,
    });
    const wb = await template.build(config, HN, { watermark: false });
    const buffer = await wb.xlsx.writeBuffer();
    expect(buffer.byteLength).toBeGreaterThan(4000);
    const ExcelJS = (await import("exceljs")).default;
    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(buffer);
    expect(evaluateWorkbook(reopened).errors()).toEqual([]);
  });
});
