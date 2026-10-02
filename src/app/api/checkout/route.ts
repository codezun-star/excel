import { NextResponse } from "next/server";

import { trackEvent } from "@/lib/analytics/events";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/server";
import { startCheckout } from "@/payments/checkout";
import { checkoutBodySchema } from "@/payments/schemas";
import type { ProviderId } from "@/payments/types";
import type { CountryCode } from "@/countries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Inicia un pago. Requiere sesión; el precio se calcula en el servidor. */
export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session)
    return NextResponse.json({ error: "Inicia sesión para continuar." }, { status: 401 });

  const limited = rateLimit(`checkout:${session.user.id}:${clientIp(request.headers)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429, headers: rateLimitHeaders(limited) },
    );

  const body = checkoutBodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "Solicitud inválida", issues: body.error.issues },
      { status: 400 },
    );

  const res = await startCheckout({
    user: { id: session.user.id, email: session.user.email ?? null },
    item: body.data.item,
    providerId: body.data.provider as ProviderId,
    couponCode: body.data.couponCode,
    country: body.data.country as CountryCode,
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });

  await trackEvent({
    name: "checkout_start",
    userId: session.user.id,
    templateSlug: body.data.item.kind === "template" ? body.data.item.templateSlug : null,
    props: {
      provider: body.data.provider,
      item: body.data.item,
      coupon: body.data.couponCode ?? null,
      result: res.result.type,
    },
  });
  return NextResponse.json(res.result);
}
