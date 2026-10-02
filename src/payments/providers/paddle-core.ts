import { createHmac, timingSafeEqual } from "node:crypto";

import type { BillingCycle } from "@/config/plans";

import {
  WebhookSignatureError,
  type NormalizedPaymentEvent,
  type PaidPlanCode,
  type ParsedWebhook,
} from "../types";

/**
 * Lógica pura de Paddle Billing (sin red): verificación de la firma
 * `Paddle-Signature` y normalización de eventos. Se prueba sin servidor.
 */

export const PADDLE_TOLERANCE_SECONDS = 300;

export function signPaddlePayload(rawBody: string, secret: string, ts: number): string {
  const h1 = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");
  return `ts=${ts};h1=${h1}`;
}

/** Lanza WebhookSignatureError si la firma no corresponde al cuerpo exacto recibido. */
export function verifyPaddleSignature(
  rawBody: string,
  header: string | null,
  secret: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): void {
  if (!secret) throw new WebhookSignatureError("Falta PADDLE_WEBHOOK_SECRET");
  if (!header) throw new WebhookSignatureError("Falta el encabezado Paddle-Signature");
  const parts = header.split(";").map((p) => p.trim().split("="));
  const ts = Number(parts.find(([k]) => k === "ts")?.[1]);
  const signatures = parts.filter(([k]) => k === "h1").map(([, v]) => v ?? "");
  if (!Number.isFinite(ts) || signatures.length === 0)
    throw new WebhookSignatureError("Encabezado Paddle-Signature mal formado");
  if (Math.abs(nowSeconds - ts) > PADDLE_TOLERANCE_SECONDS)
    throw new WebhookSignatureError("Firma de Paddle vencida");
  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex"),
    "utf8",
  );
  const ok = signatures.some((sig) => {
    const given = Buffer.from(sig, "utf8");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!ok) throw new WebhookSignatureError();
}

export interface PaddlePriceMap {
  plans: Record<string, { planCode: PaidPlanCode; cycle: BillingCycle }>;
  template: string | null;
}

/** Mapa price_id → plan, desde las variables PADDLE_PRICE_*. */
export function paddlePriceMap(
  env: Record<string, string | undefined> = process.env,
): PaddlePriceMap {
  const plans: PaddlePriceMap["plans"] = {};
  const add = (key: string, planCode: PaidPlanCode, cycle: BillingCycle) => {
    const id = env[key]?.trim();
    if (id) plans[id] = { planCode, cycle };
  };
  add("PADDLE_PRICE_PRO_MONTHLY", "pro", "monthly");
  add("PADDLE_PRICE_PRO_YEARLY", "pro", "yearly");
  add("PADDLE_PRICE_NEGOCIO_MONTHLY", "negocio", "monthly");
  add("PADDLE_PRICE_NEGOCIO_YEARLY", "negocio", "yearly");
  return { plans, template: env.PADDLE_PRICE_TEMPLATE?.trim() || null };
}

export function paddlePriceId(
  map: PaddlePriceMap,
  item: { kind: "plan"; planCode: PaidPlanCode; cycle: BillingCycle } | { kind: "template" },
): string | null {
  if (item.kind === "template") return map.template;
  const found = Object.entries(map.plans).find(
    ([, v]) => v.planCode === item.planCode && v.cycle === item.cycle,
  );
  return found?.[0] ?? null;
}

interface PaddleCustomData {
  userId?: string;
  templateSlug?: string;
  accessDays?: number | string;
  couponCode?: string;
}

interface PaddleEntity {
  id?: string;
  status?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  transaction_id?: string | null;
  action?: string;
  custom_data?: PaddleCustomData | null;
  items?: { price?: { id?: string } | null; price_id?: string }[];
  current_billing_period?: { ends_at?: string } | null;
  scheduled_change?: { action?: string } | null;
  canceled_at?: string | null;
  paused_at?: string | null;
  currency_code?: string;
  details?: { totals?: { grand_total?: string; total?: string } } | null;
}

interface PaddleEnvelope {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleEntity;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** Convierte un evento de Paddle Billing al formato normalizado. */
export function normalizePaddleEvent(body: PaddleEnvelope, prices: PaddlePriceMap): ParsedWebhook {
  const eventId = str(body.event_id);
  const eventType = str(body.event_type);
  if (!eventId || !eventType) throw new WebhookSignatureError("Evento de Paddle sin id o tipo");
  const data = body.data ?? {};
  const custom = data.custom_data ?? {};
  const base = {
    userId: str(custom.userId),
    couponCode: str(custom.couponCode),
  };
  let event: NormalizedPaymentEvent | null = null;

  if (eventType.startsWith("subscription.")) {
    const priceId = data.items?.[0]?.price?.id ?? data.items?.[0]?.price_id ?? "";
    const plan = prices.plans[priceId];
    const sub = {
      ...base,
      providerSubscriptionId: str(data.id),
      providerCustomerId: str(data.customer_id),
      planCode: plan?.planCode ?? null,
      cycle: plan?.cycle ?? null,
      currentPeriodEnd: str(data.current_billing_period?.ends_at),
      cancelAtPeriodEnd: data.scheduled_change?.action === "cancel",
    };
    const status = data.status;
    if (eventType === "subscription.canceled" || status === "canceled") {
      event = {
        type: "subscription.canceled",
        ...sub,
        effectiveAt: str(data.canceled_at) ?? str(body.occurred_at),
      };
    } else if (status === "paused") {
      event = {
        type: "subscription.canceled",
        ...sub,
        effectiveAt: str(data.paused_at) ?? str(body.occurred_at),
      };
    } else if (eventType === "subscription.past_due" || status === "past_due") {
      event = { type: "subscription.past_due", ...sub };
    } else if (status === "active" || status === "trialing") {
      if (!plan) return { eventId, eventType, payload: body, event: null }; // precio desconocido
      event = {
        type:
          eventType === "subscription.updated" ? "subscription.updated" : "subscription.activated",
        ...sub,
      };
    }
  } else if (eventType === "transaction.completed") {
    // Las renovaciones llegan como subscription.updated; aquí solo compras únicas.
    if (!data.subscription_id && str(custom.templateSlug)) {
      const totals = data.details?.totals;
      const minor = Number(totals?.grand_total ?? totals?.total ?? 0);
      event = {
        type: "purchase.completed",
        ...base,
        templateSlug: str(custom.templateSlug),
        providerPaymentId: str(data.id),
        amount: Number.isFinite(minor) ? minor / 100 : 0,
        currency: str(data.currency_code) ?? "USD",
        accessDays: Number(custom.accessDays) || null,
      };
    }
  } else if (eventType === "adjustment.created" || eventType === "adjustment.updated") {
    if (data.action === "refund" && data.status === "approved" && str(data.transaction_id)) {
      event = { type: "purchase.refunded", providerPaymentId: str(data.transaction_id) };
    }
  }

  return { eventId, eventType, payload: body, event };
}
