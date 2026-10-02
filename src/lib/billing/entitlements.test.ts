import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { PGlite } from "@electric-sql/pglite";

import { DEFAULT_PLANS } from "@/config/plans";
import { asRole, createTestDb, createUser } from "@/test/db";

import { canAccessTemplate, templateAccess, type EntitlementRow } from "./entitlements-core";
import { getUserEntitlements, type EntitlementStore } from "./entitlements";
import { catalogFromRows, DEFAULT_CATALOG, type PlanRow } from "./plans-core";

const USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const NOW = new Date("2026-10-02T12:00:00Z");
const catalog = DEFAULT_CATALOG;

function memoryStore(rows: EntitlementRow[]): EntitlementStore {
  return { listEntitlements: async () => rows };
}

const plan = (ref: string, validUntil: string | null, source = `subscription:${ref}`) =>
  ({ kind: "plan", ref, valid_until: validUntil, source }) as EntitlementRow;
const template = (ref: string, validUntil: string | null) =>
  ({ kind: "template", ref, valid_until: validUntil, source: `purchase:${ref}` }) as EntitlementRow;

const PLANILLA = { slug: "planilla-de-sueldos", tier: "pro" as const };
const BOLETA = { slug: "boleta-de-pago", tier: "pro" as const };
const FACTURA = { slug: "factura-con-isv", tier: "free" as const };

describe("getUserEntitlements", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("anónimo: plan gratis con el límite de descargas sin cuenta", async () => {
    const ent = await getUserEntitlements(null, { catalog, now: NOW });
    expect(ent).toMatchObject({ plan: "free", anonymous: true, downloadLimit: 3 });
    expect(ent.limits.watermark).toBe(true);
    expect(canAccessTemplate(ent, FACTURA)).toBe(true);
    expect(canAccessTemplate(ent, PLANILLA)).toBe(false);
  });

  it("cuenta sin pagos: plan gratis con su límite mensual", async () => {
    const ent = await getUserEntitlements(USER, { store: memoryStore([]), catalog, now: NOW });
    expect(ent).toMatchObject({ plan: "free", anonymous: false, downloadLimit: 5 });
    expect(ent.limits.saveConfigs).toBe(false);
  });

  it("suscripción activa: Pro con todas las plantillas y sin marca de agua", async () => {
    const ent = await getUserEntitlements(USER, {
      store: memoryStore([plan("pro", "2026-11-02T12:00:00Z")]),
      catalog,
      now: NOW,
    });
    expect(ent).toMatchObject({
      plan: "pro",
      planValidUntil: "2026-11-02T12:00:00Z",
      planSource: "subscription",
      downloadLimit: 300,
    });
    expect(ent.limits.watermark).toBe(false);
    expect(templateAccess(ent, PLANILLA)).toBe("plan");
  });

  it("suscripción vencida: vuelve al plan gratis", async () => {
    const ent = await getUserEntitlements(USER, {
      store: memoryStore([plan("pro", "2026-10-01T12:00:00Z")]),
      catalog,
      now: NOW,
    });
    expect(ent.plan).toBe("free");
    expect(canAccessTemplate(ent, PLANILLA)).toBe(false);
  });

  it("compra única: solo la plantilla comprada y mientras esté vigente", async () => {
    const ent = await getUserEntitlements(USER, {
      store: memoryStore([
        template("planilla-de-sueldos", "2026-10-09T12:00:00Z"),
        template("boleta-de-pago", "2026-09-30T12:00:00Z"),
      ]),
      catalog,
      now: NOW,
    });
    expect(ent.plan).toBe("free");
    expect(templateAccess(ent, PLANILLA)).toBe("purchase");
    expect(canAccessTemplate(ent, BOLETA)).toBe(false);
    expect(ent.templates).toEqual([
      { slug: "planilla-de-sueldos", validUntil: "2026-10-09T12:00:00Z" },
    ]);
  });

  it("cupón: el acceso otorgado por cupón cuenta como plan con su vencimiento", async () => {
    const ent = await getUserEntitlements(USER, {
      store: memoryStore([plan("pro", "2027-01-02T12:00:00Z", `coupon:GRATIS3:${USER}`)]),
      catalog,
      now: NOW,
    });
    expect(ent).toMatchObject({ plan: "pro", planSource: "coupon" });
  });

  it("con varios planes vigentes gana el de mayor nivel y, a igual nivel, el que vence después", async () => {
    const ent = await getUserEntitlements(USER, {
      store: memoryStore([
        plan("pro", "2027-06-01T00:00:00Z"),
        plan("negocio", "2026-11-01T00:00:00Z"),
        plan("negocio", "2026-12-01T00:00:00Z", "admin:x"),
      ]),
      catalog,
      now: NOW,
    });
    expect(ent).toMatchObject({
      plan: "negocio",
      planValidUntil: "2026-12-01T00:00:00Z",
      planSource: "admin",
    });
    expect(ent.limits.batchDownload).toBe(true);
  });

  it("ignora planes desconocidos o desactivados", async () => {
    const onlyFreeAndPro = { ...catalog, plans: DEFAULT_PLANS.filter((p) => p.code !== "negocio") };
    const ent = await getUserEntitlements(USER, {
      store: memoryStore([plan("negocio", null), plan("vip", null)]),
      catalog: onlyFreeAndPro,
      now: NOW,
    });
    expect(ent.plan).toBe("free");
  });

  it("usa los límites de la tabla plans y completa los que falten", () => {
    const rows: PlanRow[] = [
      {
        code: "free",
        name: "Gratis",
        description: null,
        price_monthly_usd: "0",
        price_yearly_usd: "0",
        price_once_usd: null,
        limits: { downloadsPerMonth: 10 },
        features: [],
        highlight: false,
        sort_order: 1,
      },
      {
        code: "compra-unica",
        name: "Compra única",
        description: null,
        price_monthly_usd: null,
        price_yearly_usd: null,
        price_once_usd: "4.5",
        limits: { accessDays: 14 },
        features: [],
        highlight: false,
        sort_order: 4,
      },
    ];
    const fromDb = catalogFromRows(rows);
    const free = fromDb.plans.find((p) => p.code === "free")!;
    expect(free.limits.downloadsPerMonth).toBe(10);
    expect(free.limits.anonDownloadsPerMonth).toBe(3);
    expect(free.features.length).toBeGreaterThan(0);
    expect(fromDb.oneTime).toMatchObject({ priceUsd: 4.5, accessDays: 14 });
  });

  it("DEV_GRANT_PLAN otorga un plan solo fuera de producción", async () => {
    vi.stubEnv("DEV_GRANT_PLAN", "pro");
    vi.stubEnv("NODE_ENV", "development");
    expect((await getUserEntitlements(null, { catalog, now: NOW })).plan).toBe("pro");
    vi.stubEnv("NODE_ENV", "production");
    expect((await getUserEntitlements(null, { catalog, now: NOW })).plan).toBe("free");
  });
});

describe("getUserEntitlements con la base real (PGlite)", () => {
  let db: PGlite;
  const store: EntitlementStore = {
    async listEntitlements(userId, now) {
      const { rows } = await db.query<EntitlementRow>(
        `select kind, ref, valid_until::text, source from public.entitlements
         where user_id = $1 and (valid_until is null or valid_until > $2)`,
        [userId, now.toISOString()],
      );
      return rows.map((r) => ({
        ...r,
        valid_until: r.valid_until ? new Date(r.valid_until).toISOString() : null,
      }));
    },
  };

  beforeAll(async () => {
    db = await createTestDb();
    await createUser(db, USER);
  });

  it("un cupón del 100 % canjeado en la base da acceso Pro", async () => {
    await db.query(
      `insert into public.coupons (code, percent_off, duration_months) values ('PRUEBA100', 100, 1)`,
    );
    await asRole(db, "service_role", null, () =>
      db.query(`select public.grant_coupon_access('PRUEBA100', $1, 'pro')`, [USER]),
    );
    const ent = await getUserEntitlements(USER, { store, catalog });
    expect(ent).toMatchObject({ plan: "pro", planSource: "coupon" });
    expect(canAccessTemplate(ent, PLANILLA)).toBe(true);
  });
});
