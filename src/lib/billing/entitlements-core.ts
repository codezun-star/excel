import type { PlanCode, PlanLimits } from "@/config/plans";
import type { TemplateTier } from "@/templates/types";

import { findPlan, isPlanCode, type PlanCatalog } from "./plans-core";

/** Fila de `entitlements` (solo las columnas que se usan). */
export interface EntitlementRow {
  kind: "plan" | "template";
  ref: string;
  valid_until: string | null;
  source: string;
}

export type PlanSource = "free" | "subscription" | "coupon" | "admin" | "dev";

/**
 * Lo que una persona puede hacer HOY. Es un objeto plano (serializable) para
 * poder pasarlo de componentes de servidor a componentes de cliente; la
 * decisión siempre se toma en el servidor con getUserEntitlements.
 */
export interface UserEntitlements {
  userId: string | null;
  anonymous: boolean;
  plan: PlanCode;
  planName: string;
  /** Fin del acceso al plan (ISO) o null si no vence o es el plan gratis */
  planValidUntil: string | null;
  planSource: PlanSource;
  limits: PlanLimits;
  /** Límite mensual de descargas que aplica (anónimos usan anonDownloadsPerMonth) */
  downloadLimit: number | null;
  /** Plantillas Pro compradas individualmente y vigentes */
  templates: { slug: string; validUntil: string | null }[];
}

function isActive(row: EntitlementRow, now: Date): boolean {
  return row.valid_until === null || new Date(row.valid_until).getTime() > now.getTime();
}

function sourceOf(row: EntitlementRow): PlanSource {
  const prefix = row.source.split(":")[0];
  if (prefix === "coupon") return "coupon";
  if (prefix === "admin") return "admin";
  if (prefix === "dev") return "dev";
  return "subscription";
}

/**
 * Regla única de acceso: de todas las filas vigentes se toma el plan de mayor
 * nivel (sort_order) y se suman las plantillas compradas. Sin filas vigentes,
 * plan gratis. Es una función pura para poder probarla sin base de datos.
 */
export function resolveEntitlements(input: {
  userId: string | null;
  rows: EntitlementRow[];
  catalog: PlanCatalog;
  now?: Date;
}): UserEntitlements {
  const now = input.now ?? new Date();
  const active = input.rows.filter((r) => isActive(r, now));

  let best: { row: EntitlementRow; sortOrder: number } | null = null;
  for (const row of active) {
    if (row.kind !== "plan" || !isPlanCode(row.ref) || row.ref === "free") continue;
    const plan = input.catalog.plans.find((p) => p.code === row.ref);
    if (!plan) continue; // plan desactivado o desconocido
    const later =
      best &&
      plan.sortOrder === best.sortOrder &&
      (row.valid_until === null ||
        (best.row.valid_until !== null && row.valid_until > best.row.valid_until));
    if (!best || plan.sortOrder > best.sortOrder || later)
      best = { row, sortOrder: plan.sortOrder };
  }

  const planCode: PlanCode = best ? (best.row.ref as PlanCode) : "free";
  const plan = findPlan(input.catalog, planCode);
  const anonymous = input.userId === null;

  const templates = new Map<string, string | null>();
  for (const row of active) {
    if (row.kind !== "template") continue;
    const prev = templates.get(row.ref);
    const longer =
      prev === undefined || row.valid_until === null || (prev !== null && row.valid_until > prev);
    if (longer) templates.set(row.ref, row.valid_until);
  }

  return {
    userId: input.userId,
    anonymous,
    plan: planCode,
    planName: plan.name,
    planValidUntil: best?.row.valid_until ?? null,
    planSource: best ? sourceOf(best.row) : "free",
    limits: plan.limits,
    downloadLimit: anonymous ? plan.limits.anonDownloadsPerMonth : plan.limits.downloadsPerMonth,
    templates: [...templates].map(([slug, validUntil]) => ({ slug, validUntil })),
  };
}

export type TemplateAccess = "free" | "plan" | "purchase" | "none";

/** Cómo (o si) se puede usar una plantilla con estos entitlements. */
export function templateAccess(
  ent: UserEntitlements,
  template: { slug: string; tier: TemplateTier },
): TemplateAccess {
  if (template.tier === "free") return "free";
  if (ent.limits.proTemplates) return "plan";
  if (ent.templates.some((t) => t.slug === template.slug)) return "purchase";
  return "none";
}

export function canAccessTemplate(
  ent: UserEntitlements,
  template: { slug: string; tier: TemplateTier },
): boolean {
  return templateAccess(ent, template) !== "none";
}

export function hasPaidPlan(ent: UserEntitlements): boolean {
  return ent.plan !== "free";
}
