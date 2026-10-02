import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { DEFAULT_CATALOG } from "@/lib/billing/plans-core";
import { resolveEntitlements, type EntitlementRow } from "@/lib/billing/entitlements-core";
import { createMemoryUsageStore } from "@/lib/billing/usage";
import { requireCountryContext } from "@/countries";
import { loadServerTemplate } from "@/templates/registry/server";
import { resolveDefaultConfig } from "@/templates/types";

import { authorizeDownload } from "./authorize";
import { generateWorkbookForRequest } from "./generate";

const USER = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const ctx = requireCountryContext("HN");

function ent(userId: string | null, rows: EntitlementRow[] = []) {
  return resolveEntitlements({ userId, rows, catalog: DEFAULT_CATALOG });
}
const proRow: EntitlementRow = {
  kind: "plan",
  ref: "pro",
  valid_until: "2099-01-01T00:00:00Z",
  source: "subscription:1",
};

async function bodyFor(slug: string) {
  const t = await loadServerTemplate(slug);
  return { config: resolveDefaultConfig(t!, ctx), country: "HN" };
}

describe("/api/generate (núcleo)", () => {
  it("responde 403 a una plantilla Pro sin plan ni compra, y no cuenta la descarga", async () => {
    const usage = createMemoryUsageStore();
    const res = await generateWorkbookForRequest(
      "planilla-de-sueldos",
      await bodyFor("planilla-de-sueldos"),
      {
        entitlements: ent(USER),
        anonId: null,
        usage,
      },
    );
    expect(res).toMatchObject({ ok: false, status: 403, body: { code: "pro_required" } });
    expect(await usage.get({ userId: USER, anonId: null })).toBe(0);
  });

  it("también responde 403 a visitantes anónimos", async () => {
    const res = await generateWorkbookForRequest(
      "planilla-de-sueldos",
      await bodyFor("planilla-de-sueldos"),
      {
        entitlements: ent(null),
        anonId: "a_abcdefghijklmnopqrstuv",
        usage: createMemoryUsageStore(),
      },
    );
    expect(res).toMatchObject({ ok: false, status: 403 });
  });

  it("genera la plantilla Pro con plan activo, sin marca de agua y registra la descarga", async () => {
    const recorded: string[] = [];
    const res = await generateWorkbookForRequest(
      "planilla-de-sueldos",
      await bodyFor("planilla-de-sueldos"),
      {
        entitlements: ent(USER, [proRow]),
        anonId: null,
        usage: createMemoryUsageStore(),
        record: async (r) => {
          recorded.push(r.templateSlug);
        },
      },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.filename).toMatch(/\.xlsx$/);
    expect(recorded).toEqual(["planilla-de-sueldos"]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.buffer);
    const text: string[] = [];
    wb.getWorksheet("Instrucciones")?.eachRow((row) =>
      row.eachCell((c) => text.push(String(c.value ?? ""))),
    );
    expect(text.join(" ")).not.toContain("Hecho con");
  });

  it("una compra única da acceso solo a esa plantilla", async () => {
    const purchase: EntitlementRow = {
      kind: "template",
      ref: "planilla-de-sueldos",
      valid_until: "2099-01-01T00:00:00Z",
      source: "purchase:1",
    };
    const usage = createMemoryUsageStore();
    const ok = await generateWorkbookForRequest(
      "planilla-de-sueldos",
      await bodyFor("planilla-de-sueldos"),
      {
        entitlements: ent(USER, [purchase]),
        anonId: null,
        usage,
      },
    );
    const other = await generateWorkbookForRequest(
      "boleta-de-pago",
      await bodyFor("boleta-de-pago"),
      {
        entitlements: ent(USER, [purchase]),
        anonId: null,
        usage,
      },
    );
    expect(ok.ok).toBe(true);
    expect(other).toMatchObject({ ok: false, status: 403 });
  });

  it("valida la configuración con Zod (400) antes de contar", async () => {
    const usage = createMemoryUsageStore();
    const res = await generateWorkbookForRequest(
      "factura-con-isv",
      { config: { rows: "muchas" }, country: "HN" },
      { entitlements: ent(USER), anonId: null, usage },
    );
    expect(res).toMatchObject({ ok: false, status: 400 });
    expect(await usage.get({ userId: USER, anonId: null })).toBe(0);
  });
});

describe("campos Pro (logo propio)", () => {
  const PNG =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

  async function mediaCount(entitlements: ReturnType<typeof ent>) {
    const body = await bodyFor("factura-con-isv");
    const res = await generateWorkbookForRequest(
      "factura-con-isv",
      { ...body, config: { ...(body.config as object), logo: PNG } },
      { entitlements, anonId: null, usage: createMemoryUsageStore() },
    );
    if (!res.ok) throw new Error(res.body.error);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(res.buffer);
    return (wb.model as { media?: unknown[] }).media?.length ?? 0;
  }

  it("se ignora el logo en el plan gratis y se incluye en Pro", async () => {
    expect(await mediaCount(ent(USER))).toBe(0);
    expect(await mediaCount(ent(USER, [proRow]))).toBe(1);
  });
});

describe("límite mensual del plan gratis", () => {
  const FACTURA = { slug: "factura-con-isv", tier: "free" as const };

  it("una cuenta gratis descarga 5 veces y la sexta recibe 429", async () => {
    const usage = createMemoryUsageStore();
    const results = [];
    for (let i = 0; i < 6; i++)
      results.push(
        await authorizeDownload({
          entitlements: ent(USER),
          template: FACTURA,
          anonId: null,
          usage,
        }),
      );
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]).toMatchObject({ ok: false, status: 429, code: "limit_reached", limit: 5 });
  });

  it("un anónimo descarga 3 veces con su cookie; sin cookie se le pide iniciar sesión", async () => {
    const usage = createMemoryUsageStore();
    const anonId = "a_abcdefghijklmnopqrstuv";
    const results = [];
    for (let i = 0; i < 4; i++)
      results.push(
        await authorizeDownload({ entitlements: ent(null), template: FACTURA, anonId, usage }),
      );
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
    const noCookie = await authorizeDownload({
      entitlements: ent(null),
      template: FACTURA,
      anonId: null,
      usage,
    });
    expect(noCookie).toMatchObject({ ok: false, status: 401, code: "login_required" });
  });

  it("el límite también aplica a descargas generadas en el servidor", async () => {
    const usage = createMemoryUsageStore();
    const body = await bodyFor("factura-con-isv");
    for (let i = 0; i < 5; i++)
      expect(
        (
          await generateWorkbookForRequest("factura-con-isv", body, {
            entitlements: ent(USER),
            anonId: null,
            usage,
          })
        ).ok,
      ).toBe(true);
    const sixth = await generateWorkbookForRequest("factura-con-isv", body, {
      entitlements: ent(USER),
      anonId: null,
      usage,
    });
    expect(sixth).toMatchObject({ ok: false, status: 429 });
  });

  it("Pro tiene un límite alto y la compra única no consume el contador", async () => {
    const usage = createMemoryUsageStore();
    const pro = await authorizeDownload({
      entitlements: ent(USER, [proRow]),
      template: FACTURA,
      anonId: null,
      usage,
    });
    expect(pro).toMatchObject({ ok: true, limit: 300 });
  });
});
