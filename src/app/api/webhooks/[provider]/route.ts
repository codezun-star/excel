import { NextResponse } from "next/server";

import { requireServiceSupabase } from "@/lib/billing/service-client";
import { trackEvent } from "@/lib/analytics/events";
import { getProvider } from "@/payments/registry";
import { processWebhook, type WebhookOutcome } from "@/payments/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Webhooks de todos los proveedores: /api/webhooks/paddle, /api/webhooks/paypal, … */
export async function POST(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  // El cuerpo EXACTO es necesario para verificar la firma: no usar request.json().
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000)
    return NextResponse.json({ ok: false, error: "Cuerpo demasiado grande" }, { status: 413 });

  try {
    const res = await processWebhook(
      provider,
      { rawBody, headers: request.headers },
      {
        getProvider,
        async recordEvent(providerId, parsed) {
          const db = requireServiceSupabase();
          const { data, error } = await db.rpc("process_payment_event", {
            p_provider: providerId,
            p_event_id: parsed.eventId,
            p_event_type: parsed.eventType,
            p_payload: parsed.payload,
            p_event: parsed.event ?? { type: parsed.eventType },
          });
          if (error) throw new Error(error.message);
          return data as WebhookOutcome;
        },
        async onPaymentCompleted(providerId, parsed) {
          await trackEvent({
            name: "payment_completed",
            userId: parsed.event?.userId ?? null,
            templateSlug: parsed.event?.templateSlug ?? null,
            props: {
              provider: providerId,
              type: parsed.event?.type,
              plan: parsed.event?.planCode ?? null,
              amount: parsed.event?.amount ?? null,
            },
          });
        },
      },
    );
    return NextResponse.json(res.body, { status: res.status });
  } catch (err) {
    // 500 → el proveedor reintenta más tarde (la transacción se revirtió completa).
    console.error(`[webhook:${provider}]`, (err as Error).message);
    return NextResponse.json({ ok: false, error: "Error al procesar el evento" }, { status: 500 });
  }
}
