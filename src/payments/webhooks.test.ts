import { generateKeyPairSync, createSign } from "node:crypto";

import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { asRole, createTestDb, createUser } from "@/test/db";

import { paddleProvider } from "./providers/paddle";
import {
  normalizePaddleEvent,
  paddlePriceMap,
  signPaddlePayload,
  verifyPaddleSignature,
} from "./providers/paddle-core";
import {
  decodeCustomId,
  encodeCustomId,
  isTrustedPaypalCertUrl,
  normalizePaypalEvent,
  paypalSignedMessage,
  verifyPaypalSignature,
} from "./providers/paypal-core";
import { WebhookSignatureError, type PaymentProvider, type ProviderId } from "./types";
import { processWebhook, type WebhookDeps, type WebhookOutcome } from "./webhooks";

const USER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const SECRET = "pdl_ntfset_prueba_123";

function paddleSubscriptionEvent(eventId: string, overrides: Record<string, unknown> = {}) {
  return {
    event_id: eventId,
    event_type: "subscription.activated",
    occurred_at: "2026-10-02T12:00:00Z",
    data: {
      id: "sub_01paddle",
      status: "active",
      customer_id: "ctm_01",
      items: [{ price: { id: "pri_pro_monthly" } }],
      current_billing_period: { ends_at: "2099-11-02T12:00:00Z" },
      custom_data: { userId: USER },
      ...overrides,
    },
  };
}

function signedRequest(body: unknown, secret = SECRET) {
  const rawBody = JSON.stringify(body);
  const headers = new Headers({
    "paddle-signature": signPaddlePayload(rawBody, secret, Math.floor(Date.now() / 1000)),
  });
  return { rawBody, headers };
}

describe("Paddle: firma y normalización", () => {
  const raw = '{"a":1}';

  it("acepta la firma correcta y rechaza cuerpo alterado, secreto distinto o firma vieja", () => {
    const now = 1_800_000_000;
    const header = signPaddlePayload(raw, SECRET, now);
    expect(() => verifyPaddleSignature(raw, header, SECRET, now)).not.toThrow();
    expect(() => verifyPaddleSignature('{"a":2}', header, SECRET, now)).toThrow(
      WebhookSignatureError,
    );
    expect(() => verifyPaddleSignature(raw, header, "otro", now)).toThrow(WebhookSignatureError);
    expect(() => verifyPaddleSignature(raw, header, SECRET, now + 3600)).toThrow(/vencida/);
    expect(() => verifyPaddleSignature(raw, null, SECRET, now)).toThrow(WebhookSignatureError);
    expect(() => verifyPaddleSignature(raw, header, undefined, now)).toThrow(/SECRET/);
  });

  it("toma el plan del price_id configurado, no de custom_data", () => {
    const prices = paddlePriceMap({
      PADDLE_PRICE_PRO_MONTHLY: "pri_pro_monthly",
      PADDLE_PRICE_NEGOCIO_YEARLY: "pri_neg_yearly",
    });
    const parsed = normalizePaddleEvent(
      paddleSubscriptionEvent("evt_x", { custom_data: { userId: USER, planCode: "negocio" } }),
      prices,
    );
    expect(parsed.event).toMatchObject({
      type: "subscription.activated",
      planCode: "pro",
      cycle: "monthly",
      providerSubscriptionId: "sub_01paddle",
      currentPeriodEnd: "2099-11-02T12:00:00Z",
    });
    const unknownPrice = normalizePaddleEvent(
      paddleSubscriptionEvent("evt_y", { items: [{ price: { id: "pri_desconocido" } }] }),
      prices,
    );
    expect(unknownPrice.event).toBeNull();
  });

  it("normaliza compras únicas y reembolsos", () => {
    const prices = paddlePriceMap({});
    const purchase = normalizePaddleEvent(
      {
        event_id: "evt_p",
        event_type: "transaction.completed",
        data: {
          id: "txn_01",
          subscription_id: null,
          currency_code: "USD",
          details: { totals: { grand_total: "500" } },
          custom_data: { userId: USER, templateSlug: "planilla-de-sueldos", accessDays: 7 },
        },
      },
      prices,
    );
    expect(purchase.event).toMatchObject({
      type: "purchase.completed",
      templateSlug: "planilla-de-sueldos",
      amount: 5,
      providerPaymentId: "txn_01",
      accessDays: 7,
    });
    const refund = normalizePaddleEvent(
      {
        event_id: "evt_r",
        event_type: "adjustment.updated",
        data: { action: "refund", status: "approved", transaction_id: "txn_01" },
      },
      prices,
    );
    expect(refund.event).toEqual({ type: "purchase.refunded", providerPaymentId: "txn_01" });
  });
});

describe("PayPal: firma y normalización", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const webhookId = "WH-PRUEBA";
  const raw = JSON.stringify({ id: "WH-1", event_type: "PING" });

  function paypalHeaders(body: string, certUrl = "https://api.sandbox.paypal.com/cert.pem") {
    const message = paypalSignedMessage(body, "tx-1", "2026-10-02T12:00:00Z", webhookId);
    const sig = createSign("SHA256").update(message).sign(privateKey, "base64");
    return new Headers({
      "paypal-transmission-id": "tx-1",
      "paypal-transmission-time": "2026-10-02T12:00:00Z",
      "paypal-transmission-sig": sig,
      "paypal-cert-url": certUrl,
      "paypal-auth-algo": "SHA256withRSA",
    });
  }

  it("verifica la firma RSA con el cuerpo exacto", async () => {
    const getKey = async () => publicKey;
    await expect(
      verifyPaypalSignature(raw, paypalHeaders(raw), webhookId, getKey),
    ).resolves.toBeUndefined();
    await expect(
      verifyPaypalSignature(raw + " ", paypalHeaders(raw), webhookId, getKey),
    ).rejects.toThrow(WebhookSignatureError);
    await expect(verifyPaypalSignature(raw, paypalHeaders(raw), "WH-OTRO", getKey)).rejects.toThrow(
      WebhookSignatureError,
    );
  });

  it("solo confía en certificados de dominios de PayPal", async () => {
    expect(isTrustedPaypalCertUrl("https://api.paypal.com/v1/notifications/certs/X")).toBe(true);
    expect(isTrustedPaypalCertUrl("https://paypal.com.atacante.net/cert")).toBe(false);
    expect(isTrustedPaypalCertUrl("http://api.paypal.com/cert")).toBe(false);
    await expect(
      verifyPaypalSignature(
        raw,
        paypalHeaders(raw, "https://evil.example.com/cert.pem"),
        webhookId,
        async () => publicKey,
      ),
    ).rejects.toThrow(/no confiable/);
  });

  it("codifica y decodifica custom_id dentro de 127 caracteres", () => {
    const id = encodeCustomId({
      userId: USER,
      templateSlug: "planilla-de-sueldos",
      accessDays: 7,
      couponCode: "LANZAMIENTO20",
    });
    expect(id.length).toBeLessThanOrEqual(127);
    expect(decodeCustomId(id)).toEqual({
      userId: USER,
      templateSlug: "planilla-de-sueldos",
      accessDays: 7,
      couponCode: "LANZAMIENTO20",
    });
  });

  it("las renovaciones consultan la suscripción para obtener el nuevo período", async () => {
    const plans = { "P-PRO-M": { planCode: "pro" as const, cycle: "monthly" as const } };
    const parsed = await normalizePaypalEvent(
      {
        id: "WH-2",
        event_type: "PAYMENT.SALE.COMPLETED",
        resource: { id: "SALE-1", billing_agreement_id: "I-SUB1" },
      },
      plans,
      async (id) => ({
        id,
        plan_id: "P-PRO-M",
        custom_id: `u:${USER}`,
        billing_info: { next_billing_time: "2099-12-01T00:00:00Z" },
      }),
    );
    expect(parsed.event).toMatchObject({
      type: "subscription.renewed",
      userId: USER,
      planCode: "pro",
      providerSubscriptionId: "I-SUB1",
      currentPeriodEnd: "2099-12-01T00:00:00Z",
    });
  });
});

describe("processWebhook: idempotencia contra la base (PGlite)", () => {
  let db: PGlite;
  let deps: WebhookDeps;

  beforeAll(async () => {
    vi.stubEnv("PADDLE_WEBHOOK_SECRET", SECRET);
    vi.stubEnv("PADDLE_PRICE_PRO_MONTHLY", "pri_pro_monthly");
    db = await createTestDb();
    await createUser(db, USER);
    deps = {
      getProvider: (id: ProviderId) => {
        if (id !== "paddle") throw new Error("solo paddle en esta prueba");
        return paddleProvider as PaymentProvider;
      },
      recordEvent: async (provider, parsed) => {
        const { rows } = await asRole(db, "service_role", null, () =>
          db.query<{ r: WebhookOutcome }>(
            `select public.process_payment_event($1, $2, $3, $4, $5) as r`,
            [
              provider,
              parsed.eventId,
              parsed.eventType,
              JSON.stringify(parsed.payload),
              JSON.stringify(parsed.event ?? { type: parsed.eventType }),
            ],
          ),
        );
        return rows[0]!.r;
      },
    };
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("procesa el evento una vez y responde 'duplicate' en los reintentos", async () => {
    const body = paddleSubscriptionEvent("evt_idem_1");
    const first = await processWebhook("paddle", signedRequest(body), deps);
    const second = await processWebhook("paddle", signedRequest(body), deps);
    expect(first).toEqual({ status: 200, body: { ok: true, result: "processed" } });
    expect(second).toEqual({ status: 200, body: { ok: true, result: "duplicate" } });

    const subs = await db.query(`select * from public.subscriptions where user_id = $1`, [USER]);
    const ents = await db.query(`select * from public.entitlements where user_id = $1`, [USER]);
    const events = await db.query(
      `select * from public.payment_events where event_id = 'evt_idem_1'`,
    );
    expect(subs.rows).toHaveLength(1);
    expect(ents.rows).toHaveLength(1);
    expect(events.rows).toHaveLength(1);
  });

  it("rechaza con 400 una firma inválida sin tocar la base", async () => {
    const body = paddleSubscriptionEvent("evt_falso");
    const res = await processWebhook("paddle", signedRequest(body, "secreto-equivocado"), deps);
    expect(res.status).toBe(400);
    const events = await db.query(
      `select * from public.payment_events where event_id = 'evt_falso'`,
    );
    expect(events.rows).toHaveLength(0);
  });

  it("rechaza con 400 un cuerpo que no es JSON y con 404 un proveedor desconocido", async () => {
    const rawBody = "no-es-json";
    const headers = new Headers({
      "paddle-signature": signPaddlePayload(rawBody, SECRET, Math.floor(Date.now() / 1000)),
    });
    expect((await processWebhook("paddle", { rawBody, headers }, deps)).status).toBe(400);
    expect((await processWebhook("stripe", { rawBody, headers }, deps)).status).toBe(404);
  });

  it("los eventos de tipos que no usamos se registran como 'ignored'", async () => {
    const body = { event_id: "evt_cust", event_type: "customer.updated", data: { id: "ctm_01" } };
    const res = await processWebhook("paddle", signedRequest(body), deps);
    expect(res.body.result).toBe("ignored");
  });
});
