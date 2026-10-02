import { describe, expect, it } from "vitest";

import { requireCountryContext } from "@/countries";

import {
  annualIncomeTax,
  days360Inclusive,
  employeeSocialSecurity,
  monthlyPayment,
  noticeDays,
  proportionalBonus,
  utc,
} from "./calc";

const ctx = requireCountryContext("HN");

describe("cálculos de los artículos", () => {
  it("cuenta días con DIAS360 europeo + 1, como las plantillas", () => {
    expect(days360Inclusive(utc("2025-07-01"), utc("2026-06-30"))).toBe(360);
    expect(days360Inclusive(utc("2026-01-15"), utc("2026-06-30"))).toBe(166);
    expect(days360Inclusive(utc("2026-04-01"), utc("2026-12-31"))).toBe(270);
    expect(days360Inclusive(utc("2022-03-01"), utc("2026-09-30"))).toBe(1650);
  });

  it("proporcional de décimos", () => {
    expect(proportionalBonus(15000, 166, ctx)).toBe(6916.67);
    expect(proportionalBonus(15000, 400, ctx)).toBe(15000);
  });

  it("IHSS con techo y RAP sobre el excedente", () => {
    const ded = employeeSocialSecurity(15000, ctx);
    const ceiling = ctx.taxes.socialSecurity[0]!.ceiling!;
    const ihss = ded.filter((d) => d.label.startsWith("IHSS"));
    for (const d of ihss) expect(d.base).toBe(ceiling);
    const rap = ded.find((d) => d.label.startsWith("RAP"))!;
    expect(rap.base).toBeCloseTo(15000 - ceiling, 2);
  });

  it("ISR progresivo por tramos", () => {
    const { rows, total } = annualIncomeTax(440000, ctx);
    expect(rows[0]!.tax).toBe(0);
    expect(total).toBeCloseTo(17974.47 + 18369.18, 1);
    expect(annualIncomeTax(100000, ctx).total).toBe(0);
  });

  it("cuota de préstamo igual a PAGO de Excel", () => {
    expect(monthlyPayment(200000, 0.18, 36)).toBeCloseTo(7230.48, 1);
  });

  it("preaviso en días según la tabla", () => {
    expect(noticeDays(55, ctx)).toBe(60);
    expect(noticeDays(13, ctx)).toBe(30);
    expect(noticeDays(2, ctx)).toBe(1);
  });
});

describe("liquidación, ISV y amortización", () => {
  it("liquidación del ejemplo de la guía (despido injustificado)", async () => {
    const { computeLiquidation } = await import("./calc");
    const liq = computeLiquidation(
      {
        start: "2022-03-01",
        end: "2026-09-30",
        salary: 18000,
        averageSalary: 18500,
        reasonId: "despido-injustificado",
      },
      ctx,
    );
    expect(liq).toMatchObject({
      d360: 1650,
      notice: 37000,
      severance: 84791.67,
      vacation: 7000,
      d13: 13500,
      d14: 4500,
      total: 146791.67,
    });
    const quit = computeLiquidation(
      {
        start: "2022-03-01",
        end: "2026-09-30",
        salary: 18000,
        averageSalary: 18500,
        reasonId: "renuncia",
      },
      ctx,
    );
    expect(quit.notice + quit.severance).toBe(0);
    expect(quit.total).toBe(25000);
  });

  it("ISV agregado o incluido", async () => {
    const { salesTaxBreakdown } = await import("./calc");
    expect(salesTaxBreakdown(1000, 0.15, false)).toEqual({ subtotal: 1000, tax: 150, total: 1150 });
    expect(salesTaxBreakdown(1150, 0.15, true)).toEqual({ subtotal: 1000, tax: 150, total: 1150 });
  });

  it("la tabla de amortización termina en saldo cero", async () => {
    const { amortizationSchedule } = await import("./calc");
    const t = amortizationSchedule(200000, 0.18, 36);
    expect(t.rows).toHaveLength(36);
    expect(t.rows.at(-1)!.balance).toBe(0);
    expect(t.totalInterest).toBeCloseTo(7230.48 * 36 - 200000, 0);
  });
});
