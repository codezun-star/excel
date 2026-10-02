import "server-only";

import { BILLING_DEFAULTS } from "@/config/plans";
import { requireServiceSupabase } from "@/lib/billing/service-client";

import { envFlag, hasEnv } from "../config";
import { generateReference } from "../reference";
import {
  WebhookSignatureError,
  type BankInstructions,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
} from "../types";

/** Datos bancarios desde variables de entorno (nunca en el código). */
export function bankInstructions(): BankInstructions {
  return {
    bankName: process.env.MANUAL_BANK_NAME ?? "",
    accountHolder: process.env.MANUAL_BANK_ACCOUNT_HOLDER ?? "",
    accountNumber: process.env.MANUAL_BANK_ACCOUNT_NUMBER ?? "",
    accountType: process.env.MANUAL_BANK_ACCOUNT_TYPE ?? "Cuenta de ahorro",
    currency: process.env.MANUAL_BANK_CURRENCY ?? "HNL",
    extra: process.env.MANUAL_PAYMENT_EXTRA?.trim() || null,
  };
}

/** Monto en la moneda de la cuenta (HNL al tipo de cambio de referencia). */
export function localAmount(amountUsd: number): { amount: number; currency: string } {
  const currency = process.env.MANUAL_BANK_CURRENCY ?? "HNL";
  if (currency === "USD") return { amount: amountUsd, currency };
  return {
    amount: Math.ceil(amountUsd * BILLING_DEFAULTS.exchangeRateUsdHnl),
    currency,
  };
}

const PENDING_REUSE_DAYS = 7;

/**
 * Transferencia o depósito bancario. Crea un pago `pending` con una
 * referencia única; el acceso se concede cuando un admin lo aprueba en
 * /admin/pagos (función approve_manual_payment).
 */
export const manualProvider: PaymentProvider = {
  id: "manual",
  label: "Transferencia o depósito",
  description:
    "Paga desde tu banca en línea o en ventanilla y sube el comprobante. Lo revisamos en horario hábil.",
  supports: { subscriptions: true, oneTime: true },

  isEnabled() {
    return (
      envFlag("PAYMENTS_MANUAL_ENABLED", true) &&
      hasEnv("MANUAL_BANK_NAME", "MANUAL_BANK_ACCOUNT_HOLDER", "MANUAL_BANK_ACCOUNT_NUMBER")
    );
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const db = requireServiceSupabase();
    const local = localAmount(input.amountUsd);
    const item = input.item;
    const fields = {
      kind: item.kind,
      plan_code: item.kind === "plan" ? item.planCode : null,
      billing_cycle: item.kind === "plan" ? item.cycle : null,
      template_slug: item.kind === "template" ? item.templateSlug : null,
    };

    // Reutiliza un pago pendiente del mismo producto que aún no tiene comprobante.
    const since = new Date(Date.now() - PENDING_REUSE_DAYS * 86_400_000).toISOString();
    let query = db
      .from("manual_payments")
      .select("id, reference")
      .eq("user_id", input.user.id)
      .eq("status", "pending")
      .eq("kind", fields.kind)
      .is("proof_url", null)
      .gte("created_at", since)
      .limit(1);
    query =
      item.kind === "plan"
        ? query.eq("plan_code", item.planCode).eq("billing_cycle", item.cycle)
        : query.eq("template_slug", item.templateSlug);
    const { data: existing } = await query.maybeSingle();

    const amounts = {
      amount: input.amountUsd,
      currency: "USD",
      amount_local: local.amount,
      local_currency: local.currency,
      coupon_code: input.coupon?.code ?? null,
    };

    let paymentId: string;
    let reference: string;
    if (existing) {
      const { error } = await db.from("manual_payments").update(amounts).eq("id", existing.id);
      if (error) throw new Error(`No se pudo actualizar el pago: ${error.message}`);
      paymentId = existing.id as string;
      reference = existing.reference as string;
    } else {
      let lastError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        reference = generateReference(item);
        const { data, error } = await db
          .from("manual_payments")
          .insert({ user_id: input.user.id, reference, ...fields, ...amounts })
          .select("id")
          .single();
        if (!error && data) {
          paymentId = data.id as string;
          return result(paymentId, reference, input.amountUsd, local);
        }
        lastError = error?.message ?? "sin datos";
        if (error?.code !== "23505") break; // solo se reintenta si la referencia ya existía
      }
      throw new Error(`No se pudo registrar el pago: ${lastError}`);
    }
    return result(paymentId, reference, input.amountUsd, local);
  },

  async handleWebhook() {
    throw new WebhookSignatureError("El pago manual no recibe webhooks");
  },
};

function result(
  paymentId: string,
  reference: string,
  amountUsd: number,
  local: { amount: number; currency: string },
): CheckoutResult {
  return {
    type: "manual",
    paymentId,
    reference,
    amountUsd,
    amountLocal: local.amount,
    localCurrency: local.currency,
    instructions: bankInstructions(),
  };
}
