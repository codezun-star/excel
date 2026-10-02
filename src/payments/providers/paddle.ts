import "server-only";

import { envFlag, hasEnv } from "../config";
import { fetchJson } from "../http";
import {
  ProviderUnavailableError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
} from "../types";
import {
  normalizePaddleEvent,
  paddlePriceId,
  paddlePriceMap,
  verifyPaddleSignature,
} from "./paddle-core";

/**
 * Paddle Billing (tarjetas, Apple Pay, Google Pay; Paddle actúa como
 * "merchant of record" y gestiona impuestos). Se activa con
 * PAYMENTS_PADDLE_ENABLED=true y sus variables de entorno.
 */
function apiBase(): string {
  return process.env.PADDLE_ENVIRONMENT === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

async function paddleApi<T>(path: string, body?: unknown): Promise<T> {
  return fetchJson<T>(`${apiBase()}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
      "Content-Type": "application/json",
      "Paddle-Version": "1",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const paddleProvider: PaymentProvider = {
  id: "paddle",
  label: "Tarjeta de crédito o débito",
  description: "Visa, Mastercard, Apple Pay o Google Pay. Pago seguro procesado por Paddle.",
  supports: { subscriptions: true, oneTime: true },

  isEnabled() {
    return (
      envFlag("PAYMENTS_PADDLE_ENABLED") &&
      hasEnv("PADDLE_API_KEY", "PADDLE_WEBHOOK_SECRET", "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN")
    );
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!this.isEnabled()) throw new ProviderUnavailableError();
    const priceId = paddlePriceId(paddlePriceMap(), input.item);
    if (!priceId) throw new ProviderUnavailableError("Falta el precio de Paddle para este plan");
    const discountId = input.coupon?.providerCodes.paddle;
    if (input.coupon && !discountId)
      throw new ProviderUnavailableError(
        "Este cupón no está disponible con tarjeta. Prueba con transferencia.",
      );
    const res = await paddleApi<{ data: { id: string; checkout?: { url?: string | null } } }>(
      "/transactions",
      {
        items: [{ price_id: priceId, quantity: 1 }],
        ...(discountId ? { discount_id: discountId } : {}),
        custom_data: {
          userId: input.user.id,
          ...(input.item.kind === "template"
            ? { templateSlug: input.item.templateSlug, accessDays: input.accessDays }
            : {}),
          ...(input.coupon ? { couponCode: input.coupon.code } : {}),
        },
      },
    );
    // La URL es la "default payment link" configurada en Paddle (nuestra página /pago/paddle).
    const url = res.data.checkout?.url;
    if (!url) throw new Error("Paddle no devolvió la URL de pago (revisa el Default payment link)");
    return { type: "redirect", url };
  },

  async handleWebhook({ rawBody, headers }) {
    verifyPaddleSignature(
      rawBody,
      headers.get("paddle-signature"),
      process.env.PADDLE_WEBHOOK_SECRET,
    );
    return normalizePaddleEvent(JSON.parse(rawBody), paddlePriceMap());
  },

  async cancelSubscription(subscriptionId) {
    await paddleApi(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, {
      effective_from: "next_billing_period",
    });
  },

  async getCustomerPortalUrl({ customerId, subscriptionId }) {
    if (!customerId) return null;
    const res = await paddleApi<{ data: { urls?: { general?: { overview?: string } } } }>(
      `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
      subscriptionId ? { subscription_ids: [subscriptionId] } : {},
    );
    return res.data.urls?.general?.overview ?? null;
  },
};
