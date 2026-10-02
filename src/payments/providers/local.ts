import "server-only";

import { envFlag, hasEnv } from "../config";
import { ProviderUnavailableError, WebhookSignatureError, type PaymentProvider } from "../types";

/**
 * Pasarelas locales de Centroamérica — ESQUELETO. Quedan registradas y
 * documentadas para implementarlas cuando haya contrato con la pasarela:
 *
 * - Tilopay (tarjetas en Centroamérica): API de "processPayment" con
 *   redirección y webhook con firma HMAC. Variables: TILOPAY_API_KEY,
 *   TILOPAY_API_USER, TILOPAY_API_PASSWORD, TILOPAY_WEBHOOK_SECRET.
 * - Pagadito (El Salvador / Honduras): conexión con UID y WSK y
 *   confirmación por consulta de estado. Variables: PAGADITO_UID, PAGADITO_WSK.
 *
 * Para implementarlas: completar createCheckout (redirección), handleWebhook
 * (verificar firma → ParsedWebhook) y, si la pasarela no tiene webhooks,
 * una ruta de retorno que CONSULTE el estado en la API (nunca confiar en los
 * parámetros de la URL de retorno).
 */
// TODO: cambiar a true cuando los adaptadores estén implementados.
const IMPLEMENTED = false;

function skeleton(
  id: "tilopay" | "pagadito",
  label: string,
  description: string,
  envVars: string[],
): PaymentProvider {
  const flag = `PAYMENTS_${id.toUpperCase()}_ENABLED`;
  return {
    id,
    label,
    description,
    supports: { subscriptions: false, oneTime: true },
    isEnabled() {
      return IMPLEMENTED && envFlag(flag) && hasEnv(...envVars);
    },
    async createCheckout() {
      throw new ProviderUnavailableError(`${label} todavía no está disponible`);
    },
    async handleWebhook() {
      throw new WebhookSignatureError(`${label}: webhooks no implementados`);
    },
  };
}

export const tilopayProvider = skeleton(
  "tilopay",
  "Tilopay",
  "Tarjetas locales de Centroamérica.",
  ["TILOPAY_API_KEY", "TILOPAY_API_USER", "TILOPAY_API_PASSWORD", "TILOPAY_WEBHOOK_SECRET"],
);

export const pagaditoProvider = skeleton(
  "pagadito",
  "Pagadito",
  "Pagos en línea en Centroamérica.",
  ["PAGADITO_UID", "PAGADITO_WSK"],
);
