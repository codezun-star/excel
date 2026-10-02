import type { BillingCycle } from "@/config/plans";
import type { CountryCode } from "@/countries";

/**
 * Proveedores de pago: Paddle (tarjeta) y transferencia o depósito bancario
 * (manual). Para agregar otro: sumarlo aquí, implementar PaymentProvider y
 * registrarlo en registry.ts.
 */
export type ProviderId = "paddle" | "manual";
export const PROVIDER_IDS: readonly ProviderId[] = ["paddle", "manual"];

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}

/** Planes que se pueden comprar (el gratis no). */
export type PaidPlanCode = "pro" | "negocio";

export type CheckoutItem =
  | { kind: "plan"; planCode: PaidPlanCode; cycle: BillingCycle }
  | { kind: "template"; templateSlug: string };

export interface CheckoutInput {
  item: CheckoutItem;
  user: { id: string; email: string | null };
  /** Precio de lista en USD (sin cupón) */
  listPriceUsd: number;
  /** Precio final en USD (con cupón) */
  amountUsd: number;
  coupon: { code: string; percentOff: number; providerCodes: Record<string, string> } | null;
  country: CountryCode;
  /** Días de acceso de una compra única */
  accessDays: number;
  successUrl: string;
  cancelUrl: string;
}

export interface BankAccount {
  /** Identificador corto: bac, atlantida, promerica */
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  accountType: string;
  /** HNL o USD */
  currency: string;
}

export interface BankInstructions {
  accounts: BankAccount[];
  extra: string | null;
}

export type CheckoutResult =
  | { type: "redirect"; url: string }
  | {
      type: "manual";
      paymentId: string;
      reference: string;
      amountUsd: number;
      /** Monto en lempiras al tipo de cambio de referencia */
      amountHnl: number;
      instructions: BankInstructions;
    };

/** Evento de pago normalizado: la forma que espera process_payment_event (SQL). */
export interface NormalizedPaymentEvent {
  type:
    | "subscription.activated"
    | "subscription.renewed"
    | "subscription.updated"
    | "subscription.past_due"
    | "subscription.canceled"
    | "purchase.completed"
    | "purchase.refunded";
  userId?: string | null;
  email?: string | null;
  planCode?: PaidPlanCode | null;
  cycle?: BillingCycle | null;
  providerSubscriptionId?: string | null;
  providerCustomerId?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  effectiveAt?: string | null;
  templateSlug?: string | null;
  providerPaymentId?: string | null;
  amount?: number | null;
  currency?: string | null;
  accessDays?: number | null;
  couponCode?: string | null;
}

export interface WebhookRequest {
  rawBody: string;
  headers: Headers;
}

export interface ParsedWebhook {
  /** Id único del evento en el proveedor (para idempotencia) */
  eventId: string;
  eventType: string;
  payload: unknown;
  /** null si el tipo de evento no nos interesa (se registra como "ignored") */
  event: NormalizedPaymentEvent | null;
}

/** La firma no es válida: el webhook se rechaza con 400. */
export class WebhookSignatureError extends Error {
  constructor(message = "Firma del webhook inválida") {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

/** Configuración incompleta o proveedor desactivado. */
export class ProviderUnavailableError extends Error {
  constructor(message = "Este medio de pago no está disponible") {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export interface PaymentProvider {
  id: ProviderId;
  /** Nombre que ve el cliente */
  label: string;
  description: string;
  /** Activo por feature flag y con todas sus variables de entorno */
  isEnabled(): boolean;
  supports: { subscriptions: boolean; oneTime: boolean };
  /** Crea el pago. Nunca concede acceso: eso solo lo hace el webhook verificado (o un admin). */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Verifica la firma (lanza WebhookSignatureError) y normaliza el evento. */
  handleWebhook(request: WebhookRequest): Promise<ParsedWebhook>;
  /** Cancela al final del período pagado */
  cancelSubscription?(providerSubscriptionId: string): Promise<void>;
  getCustomerPortalUrl?(input: {
    customerId: string | null;
    subscriptionId: string | null;
  }): Promise<string | null>;
}
