import { itemProductCode } from "./pricing";
import type { CheckoutItem } from "./types";

export interface CouponRow {
  code: string;
  percent_off: number;
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: string | null;
  applies_to: string[] | null;
  duration_months: number;
  provider_codes: Record<string, string> | null;
  active: boolean;
}

export type CouponCheck = { ok: true; coupon: CouponRow } | { ok: false; reason: string };

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export const COUPON_CODE_RE = /^[A-Z0-9_-]{3,40}$/;

/** Reglas de validez de un cupón para un producto y un usuario (función pura). */
export function checkCoupon(
  coupon: CouponRow | null,
  item: CheckoutItem,
  alreadyRedeemed: boolean,
  now = new Date(),
): CouponCheck {
  if (!coupon || !coupon.active)
    return { ok: false, reason: "El cupón no existe o ya no está activo." };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now.getTime())
    return { ok: false, reason: "El cupón ya venció." };
  if (coupon.max_redemptions !== null && coupon.times_redeemed >= coupon.max_redemptions)
    return { ok: false, reason: "El cupón ya alcanzó su límite de usos." };
  const appliesTo = coupon.applies_to ?? [];
  if (appliesTo.length > 0 && !appliesTo.includes(itemProductCode(item)))
    return { ok: false, reason: "El cupón no aplica a esta opción." };
  if (alreadyRedeemed) return { ok: false, reason: "Ya usaste este cupón." };
  return { ok: true, coupon };
}
