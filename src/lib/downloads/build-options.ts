import type { UserEntitlements } from "@/lib/billing/entitlements-core";
import type { BuildOptions } from "@/lib/excel/workbook";

/** Opciones de construcción según el plan (marca de agua y marca propia). */
export function buildOptionsFor(
  ent: UserEntitlements,
  brand?: { name: string; footer?: string | null } | null,
): BuildOptions {
  return {
    watermark: ent.limits.watermark,
    branding:
      ent.limits.whiteLabel && brand?.name
        ? { name: brand.name, footer: brand.footer ?? undefined }
        : null,
  };
}

/** El plan no permite campos marcados como proOnly (p. ej. logo propio). */
export function stripProOnlyFields(
  config: Record<string, unknown>,
  proOnlyFields: string[],
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...config };
  for (const name of proOnlyFields) out[name] = defaults[name];
  return out;
}
