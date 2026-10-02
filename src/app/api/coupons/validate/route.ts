import { NextResponse } from "next/server";

import { getPlanCatalog } from "@/lib/billing/plans";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";
import { validateCoupon } from "@/payments/coupons";
import { applyPercentOff, listPriceUsd } from "@/payments/pricing";
import { couponBodySchema } from "@/payments/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Vista previa de un cupón (no lo canjea: el canje ocurre al confirmarse el pago). */
export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  const limited = rateLimit(`coupon:${session.user.id}:${clientIp(request.headers)}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiados intentos" },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  const body = couponBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const check = await validateCoupon(body.data.code, body.data.item, session.user.id);
  if (!check.ok) return NextResponse.json({ ok: false, error: check.reason });
  const catalog = await getPlanCatalog();
  const list = listPriceUsd(catalog, body.data.item) ?? 0;
  return NextResponse.json({
    ok: true,
    code: check.coupon.code,
    percentOff: check.coupon.percent_off,
    durationMonths: check.coupon.duration_months,
    listPriceUsd: list,
    finalPriceUsd: applyPercentOff(list, check.coupon.percent_off),
  });
}
