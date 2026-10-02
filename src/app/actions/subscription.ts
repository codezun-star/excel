"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireServiceSupabase } from "@/lib/billing/service-client";
import { getCurrentUser } from "@/lib/supabase/server";
import { checkCoupon, normalizeCouponCode, type CouponRow } from "@/payments/coupons-core";
import { getProvider } from "@/payments/registry";
import { isProviderId } from "@/payments/types";

import type { ActionResult } from "./configs";

async function ownSubscription(subscriptionId: string) {
  const session = await getCurrentUser();
  if (!session) return null;
  const db = requireServiceSupabase();
  const { data } = await db
    .from("subscriptions")
    .select("id, provider, provider_subscription_id, provider_customer_id, status")
    .eq("id", subscriptionId)
    .eq("user_id", session.user.id)
    .maybeSingle();
  return data ? { db, sub: data } : null;
}

/** Cancela la renovación: el acceso sigue hasta el final del período pagado. */
export async function cancelSubscriptionRenewal(subscriptionId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(subscriptionId).success)
    return { ok: false, error: "Id inválido" };
  const owned = await ownSubscription(subscriptionId);
  if (!owned) return { ok: false, error: "Suscripción no encontrada" };
  const { db, sub } = owned;
  const provider = isProviderId(sub.provider) ? getProvider(sub.provider) : null;
  if (provider?.cancelSubscription && sub.provider_subscription_id) {
    try {
      await provider.cancelSubscription(sub.provider_subscription_id);
    } catch (err) {
      console.error("[cancel]", (err as Error).message);
      return {
        ok: false,
        error: "No pudimos cancelar con el procesador. Escríbenos y lo resolvemos.",
      };
    }
  }
  // El webhook del proveedor confirmará el cambio; aquí se refleja de inmediato.
  await db.from("subscriptions").update({ cancel_at_period_end: true }).eq("id", sub.id);
  revalidatePath("/cuenta/suscripcion");
  return { ok: true };
}

/** URL del portal del proveedor para cambiar tarjeta o ver recibos. */
export async function customerPortalUrl(
  subscriptionId: string,
): Promise<ActionResult<{ url: string }>> {
  if (!z.string().uuid().safeParse(subscriptionId).success)
    return { ok: false, error: "Id inválido" };
  const owned = await ownSubscription(subscriptionId);
  if (!owned) return { ok: false, error: "Suscripción no encontrada" };
  const { sub } = owned;
  const provider = isProviderId(sub.provider) ? getProvider(sub.provider) : null;
  if (!provider?.getCustomerPortalUrl)
    return { ok: false, error: "No disponible para este medio de pago" };
  try {
    const url = await provider.getCustomerPortalUrl({
      customerId: sub.provider_customer_id,
      subscriptionId: sub.provider_subscription_id,
    });
    return url ? { ok: true, data: { url } } : { ok: false, error: "No disponible" };
  } catch {
    return { ok: false, error: "No pudimos abrir el portal. Intenta más tarde." };
  }
}

/** Canjea un cupón de acceso del 100 % (promociones, cortesías). */
export async function redeemAccessCoupon(
  rawCode: string,
): Promise<ActionResult<{ validUntil: string }>> {
  const code = normalizeCouponCode(String(rawCode ?? ""));
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { ok: false, error: "Código inválido" };
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Inicia sesión", code: "login_required" };
  const db = requireServiceSupabase();
  const { data: coupon } = await db
    .from("coupons")
    .select(
      "code, percent_off, max_redemptions, times_redeemed, expires_at, applies_to, duration_months, provider_codes, active",
    )
    .eq("code", code)
    .maybeSingle<CouponRow>();
  if (coupon && coupon.percent_off < 100)
    return {
      ok: false,
      error: `Este cupón da ${coupon.percent_off} % de descuento: úsalo al pagar en la página de precios.`,
    };
  const plan = coupon?.applies_to?.find((p) => p === "pro" || p === "negocio") ?? "pro";
  const { count } = await db
    .from("coupon_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("coupon_code", code)
    .eq("user_id", session.user.id);
  const check = checkCoupon(
    coupon ?? null,
    { kind: "plan", planCode: plan as "pro" | "negocio", cycle: "monthly" },
    (count ?? 0) > 0,
  );
  if (!check.ok) return { ok: false, error: check.reason };
  const { data, error } = await db.rpc("grant_coupon_access", {
    p_code: code,
    p_user_id: session.user.id,
    p_plan_code: plan,
  });
  if (error) return { ok: false, error: "No se pudo canjear el cupón" };
  revalidatePath("/cuenta/suscripcion");
  return { ok: true, data: { validUntil: String(data) } };
}
