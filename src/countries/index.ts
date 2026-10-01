import { HN } from "./hn";
import type { CountryCode, CountryContext, CountryEntry, CountrySlug } from "./types";

export type { CountryCode, CountryContext, CountryEntry, CountrySlug } from "./types";

/** Países con reglas implementadas. Agregar aquí cada nuevo módulo. */
const CONTEXTS: Partial<Record<CountryCode, CountryContext>> = {
  HN,
};

/** Lista para el selector de país (los demás aparecen como "Próximamente"). */
export const COUNTRIES: CountryEntry[] = [
  { code: "HN", slug: "hn", name: "Honduras", status: "active" },
  { code: "GT", slug: "gt", name: "Guatemala", status: "coming-soon" },
  { code: "SV", slug: "sv", name: "El Salvador", status: "coming-soon" },
  { code: "NI", slug: "ni", name: "Nicaragua", status: "coming-soon" },
  { code: "CR", slug: "cr", name: "Costa Rica", status: "coming-soon" },
  { code: "PA", slug: "pa", name: "Panamá", status: "coming-soon" },
  { code: "DO", slug: "do", name: "República Dominicana", status: "coming-soon" },
  { code: "MX", slug: "mx", name: "México", status: "coming-soon" },
  { code: "CO", slug: "co", name: "Colombia", status: "coming-soon" },
];

/** País por defecto (primer mercado). */
export const DEFAULT_COUNTRY: CountryCode = "HN";

export function getCountryContext(code: CountryCode): CountryContext | undefined {
  return CONTEXTS[code];
}

export function requireCountryContext(code: CountryCode = DEFAULT_COUNTRY): CountryContext {
  const ctx = CONTEXTS[code];
  if (!ctx) throw new Error(`No hay reglas implementadas para el país ${code}`);
  return ctx;
}

export function getCountryBySlug(slug: string): CountryContext | undefined {
  const entry = COUNTRIES.find((c) => c.slug === slug && c.status === "active");
  return entry ? CONTEXTS[entry.code] : undefined;
}

export function activeCountries(): CountryContext[] {
  return COUNTRIES.filter((c) => c.status === "active")
    .map((c) => CONTEXTS[c.code])
    .filter((c): c is CountryContext => Boolean(c));
}

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRIES.some((c) => c.code === value);
}

export function countrySlug(code: CountryCode): CountrySlug {
  return code.toLowerCase() as CountrySlug;
}
