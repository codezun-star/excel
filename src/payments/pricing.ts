import type { PlanCatalog } from "@/lib/billing/plans-core";

import type { CheckoutItem } from "./types";

/** Precio de lista en USD de lo que se compra (null si no se vende). */
export function listPriceUsd(catalog: PlanCatalog, item: CheckoutItem): number | null {
  if (item.kind === "template") return catalog.oneTime.priceUsd;
  const plan = catalog.plans.find((p) => p.code === item.planCode);
  if (!plan) return null;
  const price = item.cycle === "yearly" ? plan.priceYearlyUsd : plan.priceMonthlyUsd;
  return price && price > 0 ? price : null;
}

/** Aplica un porcentaje de descuento y redondea a centavos. */
export function applyPercentOff(amount: number, percentOff: number): number {
  const pct = Math.min(100, Math.max(0, percentOff));
  return Math.round(amount * (100 - pct)) / 100;
}

/** Código que identifica el producto en `coupons.applies_to`. */
export function itemProductCode(item: CheckoutItem): string {
  return item.kind === "plan" ? item.planCode : "compra-unica";
}

export function itemDescription(catalog: PlanCatalog, item: CheckoutItem): string {
  if (item.kind === "template") return `${catalog.oneTime.name}: ${item.templateSlug}`;
  const plan = catalog.plans.find((p) => p.code === item.planCode);
  return `${plan?.name ?? item.planCode} (${item.cycle === "yearly" ? "anual" : "mensual"})`;
}
