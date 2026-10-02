import "server-only";

import type { CountryCode } from "@/countries";
import { getPlanCatalog } from "@/lib/billing/plans";
import { requireServiceSupabase } from "@/lib/billing/service-client";
import { absoluteUrl } from "@/lib/site";
import { getTemplateMeta } from "@/templates/catalog";

import { validateCoupon } from "./coupons";
import { applyPercentOff, listPriceUsd } from "./pricing";
import { availableProviders } from "./registry";
import {
  ProviderUnavailableError,
  type CheckoutItem,
  type CheckoutResult,
  type ProviderId,
} from "./types";

export type StartCheckoutResult =
  | { ok: true; result: CheckoutResult | { type: "granted"; validUntil: string } }
  | { ok: false; status: number; error: string };

/**
 * Orquesta un pago: valida el producto, calcula el precio EN EL SERVIDOR,
 * aplica el cupón y delega en el proveedor elegido (si está disponible
 * para el país). Un cupón del 100 % en un plan otorga el acceso directo.
 */
export async function startCheckout(input: {
  user: { id: string; email: string | null };
  item: CheckoutItem;
  providerId: ProviderId;
  couponCode?: string | null;
  country: CountryCode;
}): Promise<StartCheckoutResult> {
  const catalog = await getPlanCatalog();
  const { item } = input;

  if (item.kind === "template") {
    const meta = getTemplateMeta(item.templateSlug);
    if (!meta || meta.status !== "ready" || meta.tier !== "pro")
      return { ok: false, status: 400, error: "Esa plantilla no se vende por separado." };
  }
  const listPrice = listPriceUsd(catalog, item);
  if (listPrice === null) return { ok: false, status: 400, error: "Ese plan no está a la venta." };

  let coupon: { code: string; percentOff: number; providerCodes: Record<string, string> } | null =
    null;
  if (input.couponCode) {
    const check = await validateCoupon(input.couponCode, item, input.user.id);
    if (!check.ok) return { ok: false, status: 400, error: check.reason };
    coupon = {
      code: check.coupon.code,
      percentOff: check.coupon.percent_off,
      providerCodes: check.coupon.provider_codes ?? {},
    };
  }
  const amountUsd = coupon ? applyPercentOff(listPrice, coupon.percentOff) : listPrice;

  if (amountUsd <= 0 && coupon) {
    if (item.kind !== "plan")
      return { ok: false, status: 400, error: "Este cupón solo se puede usar en un plan." };
    const db = requireServiceSupabase();
    const { data, error } = await db.rpc("grant_coupon_access", {
      p_code: coupon.code,
      p_user_id: input.user.id,
      p_plan_code: item.planCode,
    });
    if (error) return { ok: false, status: 400, error: "No se pudo aplicar el cupón." };
    return { ok: true, result: { type: "granted", validUntil: String(data) } };
  }

  const provider = availableProviders(input.country, item).find((p) => p.id === input.providerId);
  if (!provider) return { ok: false, status: 400, error: "Ese medio de pago no está disponible." };

  const returnPath = "/cuenta/suscripcion?pago=procesando";
  const cancelPath =
    item.kind === "plan"
      ? `/checkout?plan=${item.planCode}&ciclo=${item.cycle === "yearly" ? "anual" : "mensual"}`
      : `/checkout?plantilla=${item.templateSlug}`;

  try {
    const result = await provider.createCheckout({
      item,
      user: input.user,
      listPriceUsd: listPrice,
      amountUsd,
      coupon,
      country: input.country,
      accessDays: catalog.oneTime.accessDays,
      successUrl: absoluteUrl(returnPath),
      cancelUrl: absoluteUrl(cancelPath),
    });
    return { ok: true, result };
  } catch (err) {
    if (err instanceof ProviderUnavailableError)
      return { ok: false, status: 400, error: err.message };
    console.error(`[checkout:${provider.id}]`, (err as Error).message);
    return {
      ok: false,
      status: 502,
      error: "No pudimos iniciar el pago. Intenta de nuevo o elige otro medio.",
    };
  }
}
