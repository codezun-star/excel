import fs from "node:fs";

import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { asRole, createTestDb, createUser } from "./db";

const ANA = "11111111-1111-1111-1111-111111111111";
const BETO = "22222222-2222-2222-2222-222222222222";
const ADMIN = "33333333-3333-3333-3333-333333333333";
const CARLA = "44444444-4444-4444-4444-444444444444";

type Row = Record<string, unknown>;

async function service<T extends Row = Row>(db: PGlite, sql: string, params: unknown[] = []) {
  return asRole(db, "service_role", null, () => db.query<T>(sql, params));
}

async function processEvent(db: PGlite, eventId: string, event: Row) {
  const { rows } = await service<{ r: string }>(
    db,
    `select public.process_payment_event('paddle', $1, $2, $3, $4) as r`,
    [eventId, String(event.type), JSON.stringify({ raw: true }), JSON.stringify(event)],
  );
  return rows[0]!.r;
}

describe("SQL 002-004: monetización, RLS, funciones y semillas", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = await createTestDb();
    for (const id of [ANA, BETO, ADMIN, CARLA]) await createUser(db, id);
    await db.query(`update public.profiles set role = 'admin' where id = $1`, [ADMIN]);
  });

  describe("semillas y lectura pública", () => {
    it("crea los planes y el cupón de ejemplo", async () => {
      const { rows } = await asRole(db, "anon", null, () =>
        db.query<{ code: string; price_monthly_usd: string | null }>(
          `select code, price_monthly_usd from public.plans order by sort_order`,
        ),
      );
      expect(rows.map((r) => r.code)).toEqual(["free", "pro", "negocio", "compra-unica"]);
      expect(Number(rows[1]!.price_monthly_usd)).toBe(6);
      const coupon = await db.query(`select * from public.coupons where code = 'LANZAMIENTO20'`);
      expect(coupon.rows).toHaveLength(1);
    });

    it("anónimos y usuarios no pueden leer cupones ni eventos de pago", async () => {
      await expect(
        asRole(db, "anon", null, () => db.query(`select * from public.coupons`)),
      ).rejects.toThrow(/permission denied/);
      const asUser = await asRole(db, "authenticated", ANA, () =>
        db.query(`select * from public.coupons`),
      );
      expect(asUser.rows).toHaveLength(0);
      const events = await asRole(db, "authenticated", ANA, () =>
        db.query(`select * from public.payment_events`),
      );
      expect(events.rows).toHaveLength(0);
    });
  });

  describe("el cliente nunca puede otorgarse un plan", () => {
    it("no puede insertar suscripciones, entitlements ni compras", async () => {
      for (const sql of [
        `insert into public.subscriptions (user_id, plan_code, status, provider) values ('${ANA}', 'pro', 'active', 'admin')`,
        `insert into public.entitlements (user_id, kind, ref, source) values ('${ANA}', 'plan', 'pro', 'hack')`,
        `insert into public.purchases (user_id, template_slug, amount, provider) values ('${ANA}', 'planilla-de-sueldos', 0, 'admin')`,
        `insert into public.payment_events (provider, event_id, event_type, payload) values ('paddle', 'x', 'y', '{}')`,
        `insert into public.usage_counters (user_id, month) values ('${ANA}', '2026-01-01')`,
        `insert into public.manual_payments (user_id, kind, template_slug, amount, reference) values ('${ANA}', 'template', 'kardex', 5, 'ABC-123456')`,
      ]) {
        await expect(asRole(db, "authenticated", ANA, () => db.query(sql))).rejects.toThrow();
      }
    });

    it("no puede cambiarse el rol a admin", async () => {
      await expect(
        asRole(db, "authenticated", ANA, () =>
          db.query(`update public.profiles set role = 'admin' where id = $1`, [ANA]),
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it("no puede ejecutar las funciones que otorgan accesos", async () => {
      for (const sql of [
        `select public.process_payment_event('paddle', 'e1', 't', '{}', '{}')`,
        `select public.approve_manual_payment(gen_random_uuid(), '${ANA}')`,
        `select * from public.increment_download_usage('${ANA}', null, 100)`,
        `select public.grant_coupon_access('LANZAMIENTO20', '${ANA}', 'pro')`,
        `select public.redeem_coupon('LANZAMIENTO20', '${ANA}', 'x')`,
      ]) {
        await expect(asRole(db, "authenticated", ANA, () => db.query(sql))).rejects.toThrow(
          /permission denied/,
        );
      }
    });

    it("ya no puede registrar descargas ni guardar configuraciones directamente", async () => {
      await expect(
        asRole(db, "authenticated", ANA, () =>
          db.query(
            `insert into public.downloads (user_id, template_slug, country) values ($1, 'kardex', 'HN')`,
            [ANA],
          ),
        ),
      ).rejects.toThrow(/permission denied/);
      await expect(
        asRole(db, "authenticated", ANA, () =>
          db.query(`insert into public.saved_configs (template_slug, name) values ('kardex', 'x')`),
        ),
      ).rejects.toThrow(/permission denied/);
    });

    it("un admin sí puede otorgar accesos y leer todo", async () => {
      const ok = await asRole(db, "authenticated", ADMIN, () =>
        db.query(
          `insert into public.entitlements (user_id, kind, ref, valid_until, source)
           values ($1, 'plan', 'pro', now() + interval '1 day', 'admin:prueba')`,
          [CARLA],
        ),
      );
      expect(ok.affectedRows).toBe(1);
      const profiles = await asRole(db, "authenticated", ADMIN, () =>
        db.query(`select id from public.profiles`),
      );
      expect(profiles.rows.length).toBeGreaterThanOrEqual(4);
      const isAdmin = await asRole(db, "authenticated", ADMIN, () =>
        db.query<{ a: boolean }>(`select public.is_admin() as a`),
      );
      expect(isAdmin.rows[0]!.a).toBe(true);
    });
  });

  describe("process_payment_event", () => {
    it("activa una suscripción, crea el entitlement e ignora duplicados", async () => {
      const event = {
        type: "subscription.activated",
        userId: ANA,
        planCode: "pro",
        cycle: "monthly",
        providerSubscriptionId: "sub_001",
        currentPeriodEnd: "2099-01-01T00:00:00Z",
      };
      expect(await processEvent(db, "evt_1", event)).toBe("processed");
      expect(await processEvent(db, "evt_1", event)).toBe("duplicate");

      const subs = await service<{ status: string }>(
        db,
        `select status from public.subscriptions where provider_subscription_id = 'sub_001'`,
      );
      expect(subs.rows).toEqual([{ status: "active" }]);
      const ents = await asRole(db, "authenticated", ANA, () =>
        db.query<{ ref: string }>(`select ref from public.entitlements where kind = 'plan'`),
      );
      expect(ents.rows).toEqual([{ ref: "pro" }]);
      const logged = await service(
        db,
        `select * from public.payment_events where event_id = 'evt_1'`,
      );
      expect(logged.rows).toHaveLength(1);
    });

    it("cada usuario ve solo sus suscripciones", async () => {
      const mine = await asRole(db, "authenticated", ANA, () =>
        db.query(`select * from public.subscriptions`),
      );
      const theirs = await asRole(db, "authenticated", BETO, () =>
        db.query(`select * from public.subscriptions`),
      );
      expect(mine.rows).toHaveLength(1);
      expect(theirs.rows).toHaveLength(0);
    });

    it("la cancelación vence el entitlement", async () => {
      const r = await processEvent(db, "evt_2", {
        type: "subscription.canceled",
        providerSubscriptionId: "sub_001",
        effectiveAt: "2020-01-01T00:00:00Z",
      });
      expect(r).toBe("processed");
      const { rows } = await service<{ valid: boolean }>(
        db,
        `select valid_until > now() as valid from public.entitlements e
         join public.subscriptions s on e.source = 'subscription:' || s.id
         where s.provider_subscription_id = 'sub_001'`,
      );
      expect(rows).toEqual([{ valid: false }]);
    });

    it("registra compras únicas con acceso por días y asocia por correo", async () => {
      const r = await processEvent(db, "evt_3", {
        type: "purchase.completed",
        email: `${BETO.slice(0, 8)}@test.hn`,
        templateSlug: "planilla-de-sueldos",
        amount: 5,
        providerPaymentId: "pay_001",
        accessDays: 7,
      });
      expect(r).toBe("processed");
      const { rows } = await service<{ ref: string; days: number }>(
        db,
        `select ref, round(extract(epoch from valid_until - now()) / 86400)::int as days
         from public.entitlements where user_id = $1 and kind = 'template'`,
        [BETO],
      );
      expect(rows).toEqual([{ ref: "planilla-de-sueldos", days: 7 }]);
    });

    it("un evento incompleto revierte todo (incluido el registro del evento)", async () => {
      await expect(
        processEvent(db, "evt_bad", { type: "subscription.activated", planCode: "pro" }),
      ).rejects.toThrow(/incompleto/);
      const logged = await service(
        db,
        `select * from public.payment_events where event_id = 'evt_bad'`,
      );
      expect(logged.rows).toHaveLength(0);
    });

    it("ignora tipos desconocidos pero los registra", async () => {
      expect(await processEvent(db, "evt_4", { type: "customer.updated" })).toBe("ignored");
    });
  });

  describe("increment_download_usage", () => {
    it("respeta el límite mensual de una cuenta", async () => {
      const results: boolean[] = [];
      for (let i = 0; i < 4; i++) {
        const { rows } = await service<{ allowed: boolean; used: number; remaining: number }>(
          db,
          `select * from public.increment_download_usage($1, null, 3)`,
          [CARLA],
        );
        results.push(rows[0]!.allowed);
        if (i === 3) expect(rows[0]).toMatchObject({ allowed: false, used: 3, remaining: 0 });
      }
      expect(results).toEqual([true, true, true, false]);
    });

    it("cuenta por separado a los anónimos y sin límite cuando es null", async () => {
      const anon = await service<{ allowed: boolean; used: number }>(
        db,
        `select * from public.increment_download_usage(null, 'anon_abcdefghijklmnop', 1)`,
      );
      expect(anon.rows[0]).toMatchObject({ allowed: true, used: 1 });
      const again = await service<{ allowed: boolean }>(
        db,
        `select * from public.increment_download_usage(null, 'anon_abcdefghijklmnop', 1)`,
      );
      expect(again.rows[0]!.allowed).toBe(false);
      const unlimited = await service<{ allowed: boolean; remaining: number | null }>(
        db,
        `select * from public.increment_download_usage($1, null, null)`,
        [ANA],
      );
      expect(unlimited.rows[0]).toMatchObject({ allowed: true, remaining: null });
      const usage = await service<{ n: number }>(
        db,
        `select public.get_download_usage($1, null) as n`,
        [CARLA],
      );
      expect(usage.rows[0]!.n).toBe(3);
    });
  });

  describe("pagos manuales", () => {
    async function createPayment(user: string, extra: Row) {
      const cols = Object.keys(extra);
      const { rows } = await service<{ id: string }>(
        db,
        `insert into public.manual_payments (user_id, ${cols.join(", ")})
         values ($1, ${cols.map((_, i) => `$${i + 2}`).join(", ")}) returning id`,
        [user, ...Object.values(extra)],
      );
      return rows[0]!.id;
    }

    it("aprobar un plan anual crea la suscripción y un año de acceso", async () => {
      const id = await createPayment(BETO, {
        kind: "plan",
        plan_code: "pro",
        billing_cycle: "yearly",
        amount: 50,
        reference: "EXC-PRO-0001",
      });
      const { rows } = await service<{ r: { planCode: string; validUntil: string } }>(
        db,
        `select public.approve_manual_payment($1, $2) as r`,
        [id, ADMIN],
      );
      expect(rows[0]!.r.planCode).toBe("pro");
      const ent = await service<{ days: number }>(
        db,
        `select round(extract(epoch from valid_until - now()) / 86400)::int as days
         from public.entitlements where user_id = $1 and kind = 'plan'`,
        [BETO],
      );
      expect(ent.rows[0]!.days).toBeGreaterThanOrEqual(365);
      const pay = await service<{ status: string; reviewed_by: string }>(
        db,
        `select status, reviewed_by from public.manual_payments where id = $1`,
        [id],
      );
      expect(pay.rows[0]).toEqual({ status: "approved", reviewed_by: ADMIN });
      // No se puede aprobar dos veces
      await expect(
        service(db, `select public.approve_manual_payment($1, $2)`, [id, ADMIN]),
      ).rejects.toThrow(/ya fue revisado/);
    });

    it("aprobar una compra única crea la compra y el acceso temporal", async () => {
      const id = await createPayment(CARLA, {
        kind: "template",
        template_slug: "boleta-de-pago",
        amount: 5,
        reference: "EXC-TPL-0002",
        coupon_code: "LANZAMIENTO20",
      });
      await service(db, `select public.approve_manual_payment($1, $2, 7)`, [id, ADMIN]);
      const purchases = await asRole(db, "authenticated", CARLA, () =>
        db.query<{ template_slug: string }>(`select template_slug from public.purchases`),
      );
      expect(purchases.rows).toEqual([{ template_slug: "boleta-de-pago" }]);
      const redeemed = await service(
        db,
        `select * from public.coupon_redemptions where user_id = $1`,
        [CARLA],
      );
      expect(redeemed.rows).toHaveLength(1);
    });

    it("rechazar guarda el motivo", async () => {
      const id = await createPayment(ANA, {
        kind: "template",
        template_slug: "kardex",
        amount: 5,
        reference: "EXC-TPL-0003",
      });
      await service(db, `select public.reject_manual_payment($1, $2, 'Comprobante ilegible')`, [
        id,
        ADMIN,
      ]);
      const { rows } = await asRole(db, "authenticated", ANA, () =>
        db.query<{ status: string; rejection_reason: string }>(
          `select status, rejection_reason from public.manual_payments where id = $1`,
          [id],
        ),
      );
      expect(rows[0]).toEqual({ status: "rejected", rejection_reason: "Comprobante ilegible" });
    });
  });

  describe("cupones", () => {
    it("un usuario canjea un cupón una sola vez y se respeta el máximo", async () => {
      await service(
        db,
        `insert into public.coupons (code, percent_off, max_redemptions) values ('UNO', 10, 1)`,
      );
      const first = await service<{ ok: boolean }>(
        db,
        `select public.redeem_coupon('uno', $1, 'x') as ok`,
        [ANA],
      );
      const repeat = await service<{ ok: boolean }>(
        db,
        `select public.redeem_coupon('UNO', $1, 'x') as ok`,
        [ANA],
      );
      const other = await service<{ ok: boolean }>(
        db,
        `select public.redeem_coupon('UNO', $1, 'x') as ok`,
        [BETO],
      );
      expect([first.rows[0]!.ok, repeat.rows[0]!.ok, other.rows[0]!.ok]).toEqual([
        true,
        false,
        false,
      ]);
    });

    it("un cupón del 100 % otorga el plan por su duración", async () => {
      await service(
        db,
        `insert into public.coupons (code, percent_off, duration_months, applies_to) values ('GRATIS3', 100, 3, '{pro}')`,
      );
      await expect(
        service(db, `select public.grant_coupon_access('GRATIS3', $1, 'negocio')`, [ANA]),
      ).rejects.toThrow(/no aplica/);
      const { rows } = await service<{ until: string }>(
        db,
        `select public.grant_coupon_access('GRATIS3', $1, 'pro') as until`,
        [ANA],
      );
      const days = (new Date(rows[0]!.until).getTime() - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(85);
      await expect(
        service(db, `select public.grant_coupon_access('GRATIS3', $1, 'pro')`, [ANA]),
      ).rejects.toThrow(/ya fue usado/);
    });
  });

  describe("almacenamiento y perfiles de cliente", () => {
    it("cada usuario ve solo sus comprobantes; el admin, todos", async () => {
      await db.query(
        `insert into storage.objects (bucket_id, name) values
         ('payment-proofs', '${ANA}/EXC-1.png'), ('payment-proofs', '${BETO}/EXC-2.png')`,
      );
      const ana = await asRole(db, "authenticated", ANA, () =>
        db.query(`select name from storage.objects`),
      );
      const admin = await asRole(db, "authenticated", ADMIN, () =>
        db.query(`select name from storage.objects`),
      );
      expect(ana.rows).toEqual([{ name: `${ANA}/EXC-1.png` }]);
      expect(admin.rows).toHaveLength(2);
      const bucket = await db.query<{ public: boolean }>(
        `select public from storage.buckets where id = 'payment-proofs'`,
      );
      expect(bucket.rows[0]!.public).toBe(false);
    });

    it("los perfiles de cliente se crean desde el servidor y el dueño solo ve los suyos", async () => {
      await expect(
        asRole(db, "authenticated", ANA, () =>
          db.query(`insert into public.client_profiles (owner_id, name) values ($1, 'X')`, [ANA]),
        ),
      ).rejects.toThrow(/permission denied/);
      await service(
        db,
        `insert into public.client_profiles (owner_id, name, rtn) values ($1, 'Pulpería Ana', '08011999123456')`,
        [ANA],
      );
      const mine = await asRole(db, "authenticated", ANA, () =>
        db.query(`select name from public.client_profiles`),
      );
      const theirs = await asRole(db, "authenticated", BETO, () =>
        db.query(`select name from public.client_profiles`),
      );
      expect(mine.rows).toEqual([{ name: "Pulpería Ana" }]);
      expect(theirs.rows).toHaveLength(0);
    });
  });

  it("los scripts se pueden ejecutar dos veces", async () => {
    for (const file of ["002_monetizacion.sql", "003_storage.sql", "004_semillas.sql"]) {
      const sql = fs.readFileSync(`supabase/sql/${file}`, "utf8");
      await expect(db.exec(sql)).resolves.toBeDefined();
    }
    const plans = await db.query(`select * from public.plans`);
    expect(plans.rows).toHaveLength(4);
  });
});
