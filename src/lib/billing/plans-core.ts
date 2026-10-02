import {
  DEFAULT_ONE_TIME,
  DEFAULT_PLANS,
  type PlanCode,
  type PlanDefinition,
  type PlanLimits,
} from "@/config/plans";

/** Fila de la tabla `plans` tal como la devuelve Supabase. */
export interface PlanRow {
  code: string;
  name: string;
  description: string | null;
  price_monthly_usd: number | string | null;
  price_yearly_usd: number | string | null;
  price_once_usd: number | string | null;
  limits: Record<string, unknown> | null;
  features: unknown;
  highlight: boolean | null;
  sort_order: number | null;
}

export interface OneTimeOffer {
  code: string;
  name: string;
  priceUsd: number;
  accessDays: number;
}

export interface PlanCatalog {
  plans: PlanDefinition[];
  oneTime: OneTimeOffer;
  /** "db" si se leyó de la base; "defaults" si se usaron los valores de src/config/plans.ts */
  source: "db" | "defaults";
}

export const DEFAULT_CATALOG: PlanCatalog = {
  plans: DEFAULT_PLANS,
  oneTime: {
    code: DEFAULT_ONE_TIME.code,
    name: DEFAULT_ONE_TIME.name,
    priceUsd: DEFAULT_ONE_TIME.priceUsd,
    accessDays: DEFAULT_ONE_TIME.accessDays,
  },
  source: "defaults",
};

const PLAN_CODES: readonly PlanCode[] = ["free", "pro", "negocio"];

export function isPlanCode(value: string): value is PlanCode {
  return (PLAN_CODES as readonly string[]).includes(value);
}

function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mergeLimits(base: PlanLimits, raw: Record<string, unknown> | null): PlanLimits {
  const out: PlanLimits = { ...base };
  if (!raw) return out;
  for (const key of Object.keys(base) as (keyof PlanLimits)[]) {
    const v = raw[key];
    if (v === undefined) continue;
    if (typeof base[key] === "boolean" && typeof v === "boolean") {
      (out[key] as boolean) = v;
    } else if (key === "downloadsPerMonth" && v === null) {
      out.downloadsPerMonth = null;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      (out[key] as number) = v;
    }
  }
  return out;
}

/**
 * Convierte las filas de `plans` en el catálogo que usa el código. Los
 * valores que falten en la base se completan con los de src/config/plans.ts.
 */
export function catalogFromRows(rows: PlanRow[]): PlanCatalog {
  const plans: PlanDefinition[] = [];
  let oneTime = DEFAULT_CATALOG.oneTime;
  for (const row of rows) {
    if (row.code === DEFAULT_ONE_TIME.code) {
      const accessDays = num(row.limits?.accessDays as number | undefined);
      oneTime = {
        code: row.code,
        name: row.name || DEFAULT_ONE_TIME.name,
        priceUsd: num(row.price_once_usd) ?? DEFAULT_ONE_TIME.priceUsd,
        accessDays: accessDays ?? DEFAULT_ONE_TIME.accessDays,
      };
      continue;
    }
    if (!isPlanCode(row.code)) continue;
    const base = DEFAULT_PLANS.find((p) => p.code === row.code)!;
    const features = Array.isArray(row.features)
      ? row.features.filter((f): f is string => typeof f === "string")
      : base.features;
    plans.push({
      code: row.code,
      name: row.name || base.name,
      tagline: row.description ?? base.tagline,
      priceMonthlyUsd: num(row.price_monthly_usd),
      priceYearlyUsd: num(row.price_yearly_usd),
      limits: mergeLimits(base.limits, row.limits),
      features: features.length ? features : base.features,
      highlight: row.highlight ?? base.highlight,
      sortOrder: row.sort_order ?? base.sortOrder,
    });
  }
  // El plan gratis siempre existe aunque alguien lo desactive en la base.
  if (!plans.some((p) => p.code === "free")) plans.push(DEFAULT_PLANS[0]!);
  plans.sort((a, b) => a.sortOrder - b.sortOrder);
  return { plans, oneTime, source: "db" };
}

export function findPlan(catalog: PlanCatalog, code: PlanCode): PlanDefinition {
  return catalog.plans.find((p) => p.code === code) ?? DEFAULT_PLANS.find((p) => p.code === code)!;
}
