import type { CountryCode } from "@/countries";

import type { ProviderId } from "./types";

/**
 * Qué medios de pago se ofrecen en cada país y en qué orden. Un proveedor
 * aparece solo si además está activado por su feature flag
 * (PAYMENTS_<PROVEEDOR>_ENABLED=true) y tiene todas sus variables de entorno.
 */
export const COUNTRY_PROVIDERS: Partial<Record<CountryCode, ProviderId[]>> & {
  default: ProviderId[];
} = {
  HN: ["paddle", "paypal", "tilopay", "pagadito", "manual"],
  default: ["paddle", "paypal", "manual"],
};

/** Lee un flag booleano de entorno ("true", "1", "yes", "si"). */
export function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return defaultValue;
  return ["true", "1", "yes", "si", "sí", "on"].includes(raw.trim().toLowerCase());
}

/** Todas las variables existen y no están vacías. */
export function hasEnv(...names: string[]): boolean {
  return names.every((n) => Boolean(process.env[n]?.trim()));
}

export function providerOrder(country: CountryCode): ProviderId[] {
  return COUNTRY_PROVIDERS[country] ?? COUNTRY_PROVIDERS.default;
}
