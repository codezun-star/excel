import {
  isProviderId,
  WebhookSignatureError,
  type ParsedWebhook,
  type PaymentProvider,
  type ProviderId,
} from "./types";

export type WebhookOutcome = "processed" | "duplicate" | "ignored";

export interface WebhookDeps {
  getProvider: (id: ProviderId) => PaymentProvider;
  /** Guarda y aplica el evento en UNA transacción (process_payment_event). */
  recordEvent: (provider: ProviderId, parsed: ParsedWebhook) => Promise<WebhookOutcome>;
  /** Analítica opcional cuando se completa un pago */
  onPaymentCompleted?: (provider: ProviderId, parsed: ParsedWebhook) => Promise<void>;
}

export interface WebhookResponse {
  status: number;
  body: { ok: boolean; result?: WebhookOutcome; error?: string };
}

/**
 * Flujo único de webhooks: 1) verificar firma (400 si falla), 2) guardar en
 * payment_events y aplicar en una transacción, ignorando duplicados.
 * Nunca se concede acceso por la redirección del navegador: solo aquí.
 */
export async function processWebhook(
  providerParam: string,
  request: { rawBody: string; headers: Headers },
  deps: WebhookDeps,
): Promise<WebhookResponse> {
  if (!isProviderId(providerParam))
    return { status: 404, body: { ok: false, error: "Proveedor desconocido" } };
  const provider = deps.getProvider(providerParam);

  let parsed: ParsedWebhook;
  try {
    parsed = await provider.handleWebhook(request);
  } catch (err) {
    if (err instanceof WebhookSignatureError || err instanceof SyntaxError)
      return { status: 400, body: { ok: false, error: err.message } };
    throw err;
  }

  const result = await deps.recordEvent(providerParam, parsed);
  if (
    result === "processed" &&
    deps.onPaymentCompleted &&
    (parsed.event?.type === "subscription.activated" || parsed.event?.type === "purchase.completed")
  ) {
    await deps.onPaymentCompleted(providerParam, parsed).catch(() => undefined);
  }
  return { status: 200, body: { ok: true, result } };
}
