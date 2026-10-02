import "server-only";

import { X509Certificate, type KeyObject } from "node:crypto";

import { absoluteUrl, SITE } from "@/lib/site";

import { envFlag, hasEnv } from "../config";
import { fetchJson } from "../http";
import {
  ProviderUnavailableError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
} from "../types";
import {
  encodeCustomId,
  normalizePaypalEvent,
  paypalPlanId,
  paypalPlanMap,
  verifyPaypalSignature,
  type PaypalSubscriptionInfo,
} from "./paypal-core";

/** PayPal (cuenta PayPal o tarjeta como invitado). PAYMENTS_PAYPAL_ENABLED=true. */
function apiBase(): string {
  return process.env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const basic = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetchJson<{ access_token: string; expires_in: number }>(
    `${apiBase()}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );
  token = { value: res.access_token, expiresAt: Date.now() + res.expires_in * 1000 };
  return token.value;
}

async function paypalApi<T>(path: string, body?: unknown, method?: string): Promise<T> {
  return fetchJson<T>(`${apiBase()}${path}`, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const certCache = new Map<string, KeyObject>();

async function paypalPublicKey(certUrl: string): Promise<KeyObject> {
  const cached = certCache.get(certUrl);
  if (cached) return cached;
  const res = await fetch(certUrl, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`No se pudo descargar el certificado de PayPal (${res.status})`);
  const cert = new X509Certificate(await res.text());
  const now = Date.now();
  if (new Date(cert.validTo).getTime() < now || new Date(cert.validFrom).getTime() > now)
    throw new Error("Certificado de PayPal vencido");
  certCache.set(certUrl, cert.publicKey);
  return cert.publicKey;
}

type Link = { href: string; rel: string };

function approveLink(links: Link[] | undefined): string {
  const link = links?.find((l) => l.rel === "approve" || l.rel === "payer-action");
  if (!link) throw new Error("PayPal no devolvió el enlace de aprobación");
  return link.href;
}

const experience = (input: CheckoutInput) => ({
  brand_name: SITE.name,
  locale: "es-HN",
  shipping_preference: "NO_SHIPPING",
  return_url: input.successUrl,
  cancel_url: input.cancelUrl,
});

export const paypalProvider: PaymentProvider = {
  id: "paypal",
  label: "PayPal",
  description: "Paga con tu cuenta PayPal o con tarjeta como invitado.",
  supports: { subscriptions: true, oneTime: true },

  isEnabled() {
    return (
      envFlag("PAYMENTS_PAYPAL_ENABLED") &&
      hasEnv("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID")
    );
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!this.isEnabled()) throw new ProviderUnavailableError();
    const item = input.item;

    if (item.kind === "plan") {
      if (input.coupon)
        throw new ProviderUnavailableError(
          "Los cupones no aplican a suscripciones con PayPal. Usa tarjeta o transferencia.",
        );
      const planId = paypalPlanId(paypalPlanMap(), item.planCode, item.cycle);
      if (!planId) throw new ProviderUnavailableError("Falta el plan de PayPal para esta opción");
      const res = await paypalApi<{ links?: Link[] }>("/v1/billing/subscriptions", {
        plan_id: planId,
        custom_id: encodeCustomId({ userId: input.user.id }),
        ...(input.user.email ? { subscriber: { email_address: input.user.email } } : {}),
        application_context: { ...experience(input), user_action: "SUBSCRIBE_NOW" },
      });
      return { type: "redirect", url: approveLink(res.links) };
    }

    // Compra única: orden con el monto calculado en el servidor. Al volver,
    // /api/payments/paypal/return la captura; el acceso llega con el webhook.
    const res = await paypalApi<{ links?: Link[] }>("/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: encodeCustomId({
            userId: input.user.id,
            templateSlug: item.templateSlug,
            accessDays: input.accessDays,
            couponCode: input.coupon?.code,
          }),
          description: `Plantilla ${item.templateSlug} — ${SITE.name}`.slice(0, 127),
          amount: { currency_code: "USD", value: input.amountUsd.toFixed(2) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            ...experience(input),
            return_url: absoluteUrl("/api/payments/paypal/return"),
            user_action: "PAY_NOW",
          },
        },
      },
    });
    return { type: "redirect", url: approveLink(res.links) };
  },

  async handleWebhook({ rawBody, headers }) {
    await verifyPaypalSignature(rawBody, headers, process.env.PAYPAL_WEBHOOK_ID, paypalPublicKey);
    return normalizePaypalEvent(JSON.parse(rawBody), paypalPlanMap(), (id) =>
      paypalApi<PaypalSubscriptionInfo>(`/v1/billing/subscriptions/${encodeURIComponent(id)}`),
    );
  },

  async cancelSubscription(subscriptionId) {
    await fetchJson(
      `${apiBase()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await accessToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Cancelado por el cliente desde Excel Codezun" }),
      },
    );
  },

  async getCustomerPortalUrl() {
    return process.env.PAYPAL_ENVIRONMENT === "live"
      ? "https://www.paypal.com/myaccount/autopay/"
      : "https://www.sandbox.paypal.com/myaccount/autopay/";
  },
};

/** Captura una orden aprobada (al volver de PayPal). Idempotente para PayPal. */
export async function capturePaypalOrder(orderId: string): Promise<string> {
  const res = await paypalApi<{ status?: string }>(
    `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {},
  );
  return res.status ?? "UNKNOWN";
}
