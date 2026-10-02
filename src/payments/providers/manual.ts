import "server-only";

import { BILLING_DEFAULTS } from "@/config/plans";
import { requireServiceSupabase } from "@/lib/billing/service-client";

import { bankAccountsFromEnv } from "../banks";
import { envFlag } from "../config";
import { generateReference } from "../reference";
import {
  WebhookSignatureError,
  type BankInstructions,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
} from "../types";

/** Cuentas de BAC, Atlántida y Promerica desde variables de entorno (nunca en el código). */
export function bankInstructions(): BankInstructions {
  return {
    accounts: bankAccountsFromEnv(),
    extra: process.env.MANUAL_PAYMENT_EXTRA?.trim() || null,
  };
}

/** Monto en lempiras al tipo de cambio de referencia (redondeado hacia arriba). */
export function amountInHnl(amountUsd: number): number {
  return Math.ceil(amountUsd * BILLING_DEFAULTS.exchangeRateUsdHnl);
}

const PENDING_REUSE_DAYS = 7;

/**
 * Transferencia o depósito bancario. Crea un pago `pending` con una
 * referencia única; el acceso se concede cuando un admin lo aprueba en
 * /admin/pagos (función approve_manual_payment).
 */
export const manualProvider: PaymentProvider = {
  id: "manual",
  label: "Transferencia o depósito (BAC, Atlántida, Promerica)",
  description:
    "Paga en lempiras desde tu banca en línea, por ACH desde cualquier banco o en ventanilla, y sube el comprobante. Lo revisamos en horario hábil.",
  supports: { subscriptions: true, oneTime: true },

  isEnabled() {
    return envFlag("PAYMENTS_MANUAL_ENABLED", true) && bankAccountsFromEnv().length > 0;
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const db = requireServiceSupabase();
    const amountHnl = amountInHnl(input.amountUsd);
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
      amount_local: amountHnl,
      local_currency: "HNL",
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
          return result(paymentId, reference, input.amountUsd, amountHnl);
        }
        lastError = error?.message ?? "sin datos";
        if (error?.code !== "23505") break; // solo se reintenta si la referencia ya existía
      }
      throw new Error(`No se pudo registrar el pago: ${lastError}`);
    }
    return result(paymentId, reference, input.amountUsd, amountHnl);
  },

  async handleWebhook() {
    throw new WebhookSignatureError("El pago manual no recibe webhooks");
  },
};

function result(
  paymentId: string,
  reference: string,
  amountUsd: number,
  amountHnl: number,
): CheckoutResult {
  return {
    type: "manual",
    paymentId,
    reference,
    amountUsd,
    amountHnl,
    instructions: bankInstructions(),
  };
}
