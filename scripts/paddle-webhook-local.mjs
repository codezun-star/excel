#!/usr/bin/env node
/**
 * Envía un webhook de Paddle FIRMADO a tu servidor local para probar el flujo
 * completo (firma → payment_events → suscripción/compra → entitlement).
 *
 * Uso:
 *   PADDLE_WEBHOOK_SECRET=pdl_ntfset_... node scripts/paddle-webhook-local.mjs <tipo> <userId> [url]
 *
 * Tipos: activar | cancelar | compra
 * Ejemplo:
 *   node scripts/paddle-webhook-local.mjs activar 1f0c...-uuid http://localhost:3000/api/webhooks/paddle
 *
 * El price_id se toma de PADDLE_PRICE_PRO_MONTHLY (o "pri_prueba_pro" si no existe; en ese
 * caso el evento se registra como "ignored" porque el precio no corresponde a un plan).
 */
import { createHmac, randomUUID } from "node:crypto";

const [type = "activar", userId, url = "http://localhost:3000/api/webhooks/paddle"] =
  process.argv.slice(2);
const secret = process.env.PADDLE_WEBHOOK_SECRET;
if (!secret || !userId) {
  console.error("Falta PADDLE_WEBHOOK_SECRET o el userId. Revisa el uso al inicio del archivo.");
  process.exit(1);
}

const priceId = process.env.PADDLE_PRICE_PRO_MONTHLY || "pri_prueba_pro";
const subscriptionId = process.env.SUB_ID || "sub_local_prueba";
const now = new Date();
const nextMonth = new Date(now.getTime() + 30 * 86_400_000);

const bodies = {
  activar: {
    event_type: "subscription.activated",
    data: {
      id: subscriptionId,
      status: "active",
      customer_id: "ctm_local",
      items: [{ price: { id: priceId } }],
      current_billing_period: { starts_at: now.toISOString(), ends_at: nextMonth.toISOString() },
      custom_data: { userId },
    },
  },
  cancelar: {
    event_type: "subscription.canceled",
    data: {
      id: subscriptionId,
      status: "canceled",
      canceled_at: now.toISOString(),
      items: [{ price: { id: priceId } }],
      custom_data: { userId },
    },
  },
  compra: {
    event_type: "transaction.completed",
    data: {
      id: `txn_local_${Date.now()}`,
      status: "completed",
      subscription_id: null,
      currency_code: "USD",
      details: { totals: { grand_total: "500" } },
      custom_data: { userId, templateSlug: "planilla-de-sueldos", accessDays: 7 },
    },
  },
};

const payload = bodies[type];
if (!payload) {
  console.error(`Tipo desconocido: ${type}. Usa activar, cancelar o compra.`);
  process.exit(1);
}
const rawBody = JSON.stringify({
  event_id: `evt_local_${randomUUID()}`,
  occurred_at: now.toISOString(),
  ...payload,
});
const ts = Math.floor(Date.now() / 1000);
const h1 = createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex");

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Paddle-Signature": `ts=${ts};h1=${h1}` },
  body: rawBody,
});
console.log(res.status, await res.text());
