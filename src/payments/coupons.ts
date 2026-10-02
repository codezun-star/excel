import "server-only";

import { createServiceSupabase } from "@/lib/billing/service-client";

import {
  checkCoupon,
  COUPON_CODE_RE,
  normalizeCouponCode,
  type CouponCheck,
  type CouponRow,
} from "./coupons-core";
import type { CheckoutItem } from "./types";

/** Valida un cupón contra la base (vigencia, usos, producto y canje previo del usuario). */
export async function validateCoupon(
  rawCode: string,
  item: CheckoutItem,
  userId: string,
): Promise<CouponCheck> {
  const code = normalizeCouponCode(rawCode);
  if (!COUPON_CODE_RE.test(code)) return { ok: false, reason: "Código de cupón inválido." };
  const db = createServiceSupabase();
  if (!db) return { ok: false, reason: "Los cupones no están disponibles en este momento." };
  const [{ data: coupon }, { count }] = await Promise.all([
    db
      .from("coupons")
      .select(
        "code, percent_off, max_redemptions, times_redeemed, expires_at, applies_to, duration_months, provider_codes, active",
      )
      .eq("code", code)
      .maybeSingle(),
    db
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_code", code)
      .eq("user_id", userId),
  ]);
  return checkCoupon((coupon as CouponRow | null) ?? null, item, (count ?? 0) > 0);
}
