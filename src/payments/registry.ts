import "server-only";

import type { CountryCode } from "@/countries";

import { providerOrder } from "./config";
import { manualProvider } from "./providers/manual";
import { paddleProvider } from "./providers/paddle";
import { paypalProvider } from "./providers/paypal";
import { pagaditoProvider, tilopayProvider } from "./providers/local";
import type { CheckoutItem, PaymentProvider, ProviderId } from "./types";

const PROVIDERS: Record<ProviderId, PaymentProvider> = {
  manual: manualProvider,
  paddle: paddleProvider,
  paypal: paypalProvider,
  tilopay: tilopayProvider,
  pagadito: pagaditoProvider,
};

export function getProvider(id: ProviderId): PaymentProvider {
  return PROVIDERS[id];
}

/** Proveedores activos para un país y un tipo de compra, en orden de preferencia. */
export function availableProviders(country: CountryCode, item?: CheckoutItem): PaymentProvider[] {
  return providerOrder(country)
    .map((id) => PROVIDERS[id])
    .filter((p) => p.isEnabled())
    .filter((p) =>
      !item ? true : item.kind === "plan" ? p.supports.subscriptions : p.supports.oneTime,
    );
}

/** Datos públicos de un proveedor (para pasarlos a componentes de cliente). */
export interface ProviderOption {
  id: ProviderId;
  label: string;
  description: string;
  subscriptions: boolean;
  oneTime: boolean;
}

export function providerOptions(country: CountryCode): ProviderOption[] {
  return availableProviders(country).map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    subscriptions: p.supports.subscriptions,
    oneTime: p.supports.oneTime,
  }));
}
