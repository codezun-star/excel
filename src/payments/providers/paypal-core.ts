import { createVerify, type KeyObject } from "node:crypto";
import { crc32 } from "node:zlib";

import type { BillingCycle } from "@/config/plans";

import {
  WebhookSignatureError,
  type NormalizedPaymentEvent,
  type PaidPlanCode,
  type ParsedWebhook,
} from "../types";

/**
 * Lógica pura de PayPal (sin red): verificación de la firma del webhook
 * (algoritmo SHA256withRSA sobre "id|fecha|webhookId|crc32(cuerpo)", con el
 * certificado de PayPal) y normalización de eventos.
 */

export function paypalSignedMessage(
  rawBody: string,
  transmissionId: string,
  transmissionTime: string,
  webhookId: string,
): string {
  return `${transmissionId}|${transmissionTime}|${webhookId}|${crc32(Buffer.from(rawBody, "utf8"))}`;
}

/** El certificado debe venir de un dominio de PayPal por HTTPS. */
export function isTrustedPaypalCertUrl(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      (url.hostname === "paypal.com" || url.hostname.endsWith(".paypal.com"))
    );
  } catch {
    return false;
  }
}

export async function verifyPaypalSignature(
  rawBody: string,
  headers: Headers,
  webhookId: string | undefined,
  getPublicKey: (certUrl: string) => Promise<KeyObject>,
): Promise<void> {
  if (!webhookId) throw new WebhookSignatureError("Falta PAYPAL_WEBHOOK_ID");
  const transmissionId = headers.get("paypal-transmission-id");
  const transmissionTime = headers.get("paypal-transmission-time");
  const signature = headers.get("paypal-transmission-sig");
  const certUrl = headers.get("paypal-cert-url");
  const algo = headers.get("paypal-auth-algo");
  if (!transmissionId || !transmissionTime || !signature || !certUrl)
    throw new WebhookSignatureError("Faltan encabezados de firma de PayPal");
  if (algo && algo !== "SHA256withRSA")
    throw new WebhookSignatureError("Algoritmo de firma de PayPal no soportado");
  if (!isTrustedPaypalCertUrl(certUrl))
    throw new WebhookSignatureError("Certificado de PayPal de origen no confiable");
  const key = await getPublicKey(certUrl);
  const message = paypalSignedMessage(rawBody, transmissionId, transmissionTime, webhookId);
  const ok = createVerify("SHA256").update(message).verify(key, signature, "base64");
  if (!ok) throw new WebhookSignatureError();
}

export interface PaypalPlanMap {
  [planId: string]: { planCode: PaidPlanCode; cycle: BillingCycle };
}

export function paypalPlanMap(
  env: Record<string, string | undefined> = process.env,
): PaypalPlanMap {
  const map: PaypalPlanMap = {};
  const add = (key: string, planCode: PaidPlanCode, cycle: BillingCycle) => {
    const id = env[key]?.trim();
    if (id) map[id] = { planCode, cycle };
  };
  add("PAYPAL_PLAN_PRO_MONTHLY", "pro", "monthly");
  add("PAYPAL_PLAN_PRO_YEARLY", "pro", "yearly");
  add("PAYPAL_PLAN_NEGOCIO_MONTHLY", "negocio", "monthly");
  add("PAYPAL_PLAN_NEGOCIO_YEARLY", "negocio", "yearly");
  return map;
}

export function paypalPlanId(map: PaypalPlanMap, planCode: PaidPlanCode, cycle: BillingCycle) {
  return (
    Object.entries(map).find(([, v]) => v.planCode === planCode && v.cycle === cycle)?.[0] ?? null
  );
}

/**
 * custom_id (máx. 127 caracteres): "u:<userId>|t:<slug>|d:<días>|c:<cupón>".
 * Lo crea nuestro servidor al iniciar el pago.
 */
export function encodeCustomId(data: {
  userId: string;
  templateSlug?: string;
  accessDays?: number;
  couponCode?: string | null;
}): string {
  const parts = [`u:${data.userId}`];
  if (data.templateSlug) parts.push(`t:${data.templateSlug}`);
  if (data.accessDays) parts.push(`d:${data.accessDays}`);
  const withCoupon = data.couponCode ? [...parts, `c:${data.couponCode}`].join("|") : null;
  if (withCoupon && withCoupon.length <= 127) return withCoupon;
  return parts.join("|").slice(0, 127);
}

export function decodeCustomId(raw: string | null | undefined): {
  userId: string | null;
  templateSlug: string | null;
  accessDays: number | null;
  couponCode: string | null;
} {
  const out = { userId: null, templateSlug: null, accessDays: null, couponCode: null } as {
    userId: string | null;
    templateSlug: string | null;
    accessDays: number | null;
    couponCode: string | null;
  };
  for (const part of (raw ?? "").split("|")) {
    const [k, ...rest] = part.split(":");
    const v = rest.join(":");
    if (!v) continue;
    if (k === "u") out.userId = v;
    if (k === "t") out.templateSlug = v;
    if (k === "d") out.accessDays = Number(v) || null;
    if (k === "c") out.couponCode = v;
  }
  return out;
}

interface PaypalResource {
  id?: string;
  status?: string;
  plan_id?: string;
  custom_id?: string;
  billing_agreement_id?: string;
  subscriber?: { email_address?: string };
  billing_info?: { next_billing_time?: string };
  amount?: { value?: string; currency_code?: string; total?: string; currency?: string };
  links?: { href?: string; rel?: string }[];
}

interface PaypalEnvelope {
  id?: string;
  event_type?: string;
  create_time?: string;
  resource?: PaypalResource;
}

/** Datos de una suscripción (para renovaciones, que no los traen en el evento). */
export interface PaypalSubscriptionInfo {
  id: string;
  plan_id?: string;
  custom_id?: string;
  subscriber?: { email_address?: string };
  billing_info?: { next_billing_time?: string };
}

export async function normalizePaypalEvent(
  body: PaypalEnvelope,
  plans: PaypalPlanMap,
  fetchSubscription: (id: string) => Promise<PaypalSubscriptionInfo>,
): Promise<ParsedWebhook> {
  const eventId = body.id;
  const eventType = body.event_type;
  if (!eventId || !eventType) throw new WebhookSignatureError("Evento de PayPal sin id o tipo");
  const r = body.resource ?? {};
  let event: NormalizedPaymentEvent | null = null;

  const fromSubscription = (
    s: PaypalSubscriptionInfo | PaypalResource,
    type: NormalizedPaymentEvent["type"],
  ): NormalizedPaymentEvent | null => {
    const plan = s.plan_id ? plans[s.plan_id] : undefined;
    const custom = decodeCustomId(s.custom_id);
    if (!plan && type !== "subscription.canceled" && type !== "subscription.past_due") return null;
    return {
      type,
      userId: custom.userId,
      email: s.subscriber?.email_address ?? null,
      planCode: plan?.planCode ?? null,
      cycle: plan?.cycle ?? null,
      providerSubscriptionId: s.id ?? null,
      currentPeriodEnd: s.billing_info?.next_billing_time ?? null,
      couponCode: custom.couponCode,
    };
  };

  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
    case "BILLING.SUBSCRIPTION.RE-ACTIVATED":
      event = fromSubscription(r, "subscription.activated");
      break;
    case "BILLING.SUBSCRIPTION.UPDATED":
      event = r.status === "ACTIVE" ? fromSubscription(r, "subscription.updated") : null;
      break;
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      event = fromSubscription(r, "subscription.past_due");
      break;
    case "BILLING.SUBSCRIPTION.CANCELLED": {
      // Lo pagado se respeta hasta el final del período.
      const e = fromSubscription(r, "subscription.canceled");
      event = e && {
        ...e,
        effectiveAt: r.billing_info?.next_billing_time ?? body.create_time ?? null,
      };
      break;
    }
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const e = fromSubscription(r, "subscription.canceled");
      event = e && { ...e, effectiveAt: body.create_time ?? null };
      break;
    }
    case "PAYMENT.SALE.COMPLETED":
      if (r.billing_agreement_id) {
        const sub = await fetchSubscription(r.billing_agreement_id);
        event = fromSubscription(sub, "subscription.renewed");
      }
      break;
    case "PAYMENT.CAPTURE.COMPLETED": {
      const custom = decodeCustomId(r.custom_id);
      if (custom.templateSlug) {
        event = {
          type: "purchase.completed",
          userId: custom.userId,
          templateSlug: custom.templateSlug,
          accessDays: custom.accessDays,
          couponCode: custom.couponCode,
          providerPaymentId: r.id ?? null,
          amount: Number(r.amount?.value ?? 0),
          currency: r.amount?.currency_code ?? "USD",
        };
      }
      break;
    }
    case "PAYMENT.CAPTURE.REFUNDED": {
      const up = r.links?.find((l) => l.rel === "up")?.href;
      const captureId = up?.split("/").filter(Boolean).pop() ?? null;
      if (captureId) event = { type: "purchase.refunded", providerPaymentId: captureId };
      break;
    }
  }

  return { eventId, eventType, payload: body, event };
}
