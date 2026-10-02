import { describe, expect, it } from "vitest";

import { checkCoupon, type CouponRow } from "./coupons-core";
import { applyPercentOff, listPriceUsd } from "./pricing";
import { sniffProofType } from "./proof";
import { generateReference } from "./reference";
import { DEFAULT_CATALOG } from "@/lib/billing/plans-core";

const base: CouponRow = {
  code: "LANZAMIENTO20",
  percent_off: 20,
  max_redemptions: 100,
  times_redeemed: 0,
  expires_at: "2026-12-31T23:59:59Z",
  applies_to: ["pro", "negocio"],
  duration_months: 1,
  provider_codes: {},
  active: true,
};
const PRO = { kind: "plan" as const, planCode: "pro" as const, cycle: "monthly" as const };
const TEMPLATE = { kind: "template" as const, templateSlug: "planilla-de-sueldos" };
const NOW = new Date("2026-10-02T00:00:00Z");

describe("cupones", () => {
  it("valida vigencia, usos, producto y canje previo", () => {
    expect(checkCoupon(base, PRO, false, NOW).ok).toBe(true);
    expect(checkCoupon(null, PRO, false, NOW)).toMatchObject({ ok: false });
    expect(checkCoupon({ ...base, active: false }, PRO, false, NOW).ok).toBe(false);
    expect(checkCoupon(base, PRO, false, new Date("2027-01-01"))).toMatchObject({
      reason: "El cupón ya venció.",
    });
    expect(checkCoupon({ ...base, times_redeemed: 100 }, PRO, false, NOW).ok).toBe(false);
    expect(checkCoupon(base, TEMPLATE, false, NOW)).toMatchObject({
      reason: "El cupón no aplica a esta opción.",
    });
    expect(checkCoupon({ ...base, applies_to: [] }, TEMPLATE, false, NOW).ok).toBe(true);
    expect(checkCoupon(base, PRO, true, NOW)).toMatchObject({ reason: "Ya usaste este cupón." });
  });

  it("calcula precios en el servidor y aplica el descuento en centavos", () => {
    expect(listPriceUsd(DEFAULT_CATALOG, PRO)).toBe(6);
    expect(listPriceUsd(DEFAULT_CATALOG, { ...PRO, cycle: "yearly" })).toBe(50);
    expect(listPriceUsd(DEFAULT_CATALOG, TEMPLATE)).toBe(5);
    expect(applyPercentOff(6, 20)).toBe(4.8);
    expect(applyPercentOff(50, 33)).toBe(33.5);
    expect(applyPercentOff(5, 100)).toBe(0);
  });
});

describe("pagos manuales", () => {
  it("genera referencias únicas con el formato esperado", () => {
    const refs = new Set(Array.from({ length: 200 }, () => generateReference(PRO)));
    expect(refs.size).toBe(200);
    for (const r of refs) expect(r).toMatch(/^EXC-PRO-[2-9A-HJKMNP-Z]{6}$/);
    expect(generateReference(TEMPLATE)).toMatch(/^EXC-TPL-/);
  });

  it("reconoce el tipo real del comprobante por su contenido", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
    const pdf = new TextEncoder().encode("%PDF-1.7 ...");
    const exe = new TextEncoder().encode("MZ\x90\x00");
    const webp = new TextEncoder().encode("RIFF\x00\x00\x00\x00WEBPVP8 ");
    expect(sniffProofType(png)?.ext).toBe("png");
    expect(sniffProofType(pdf)?.mime).toBe("application/pdf");
    expect(sniffProofType(webp)?.ext).toBe("webp");
    expect(sniffProofType(exe)).toBeNull();
  });
});

describe("cuentas bancarias de Honduras", () => {
  it("solo muestra los bancos con número de cuenta y usa el titular por defecto", async () => {
    const { bankAccountsFromEnv, bankName } = await import("./banks");
    const accounts = bankAccountsFromEnv({
      MANUAL_BANK_ACCOUNT_HOLDER: "Codezun S. de R.L.",
      BANK_BAC_ACCOUNT_NUMBER: "730000000",
      BANK_PROMERICA_ACCOUNT_NUMBER: "10000000",
      BANK_PROMERICA_CURRENCY: "usd",
      BANK_PROMERICA_ACCOUNT_HOLDER: "Otra Empresa",
    });
    expect(accounts.map((a) => a.id)).toEqual(["bac", "promerica"]);
    expect(accounts[0]).toMatchObject({
      bankName: "BAC Credomatic",
      accountHolder: "Codezun S. de R.L.",
      currency: "HNL",
    });
    expect(accounts[1]).toMatchObject({ accountHolder: "Otra Empresa", currency: "USD" });
    expect(bankName("atlantida")).toBe("Banco Atlántida");
  });
});
