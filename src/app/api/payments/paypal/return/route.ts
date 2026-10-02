import { NextResponse } from "next/server";
import { z } from "zod";

import { absoluteUrl } from "@/lib/site";
import { capturePaypalOrder, paypalProvider } from "@/payments/providers/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Regreso desde PayPal tras aprobar una compra única: se CAPTURA la orden con
 * nuestras credenciales. El acceso NO se concede aquí: llega con el webhook
 * PAYMENT.CAPTURE.COMPLETED verificado.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = z
    .string()
    .regex(/^[A-Z0-9]{10,30}$/)
    .safeParse(url.searchParams.get("token"));
  if (!token.success || !paypalProvider.isEnabled())
    return NextResponse.redirect(absoluteUrl("/cuenta/suscripcion?pago=error"));
  try {
    await capturePaypalOrder(token.data);
    return NextResponse.redirect(absoluteUrl("/cuenta/suscripcion?pago=procesando"));
  } catch (err) {
    console.error("[paypal:return]", (err as Error).message);
    return NextResponse.redirect(absoluteUrl("/cuenta/suscripcion?pago=error"));
  }
}
