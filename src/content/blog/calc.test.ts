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
