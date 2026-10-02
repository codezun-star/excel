import { NextResponse } from "next/server";
import { z } from "zod";

import { defaultUsageStore } from "@/lib/billing/usage";
import { generateWorkbookForRequest } from "@/lib/downloads/generate";
import { recordDownload } from "@/lib/downloads/record";
import { resolveBrand, resolveRequester } from "@/lib/downloads/requester";
import { XLSX_MIME } from "@/lib/excel/download";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const extraSchema = z.object({ clientProfileId: z.string().uuid().nullish() }).passthrough();

/**
 * Genera el .xlsx en el servidor (plantillas Pro y descargas por API). Valida
 * sesión o cookie anónima, entitlement, límite mensual y la configuración (Zod).
 * El código de las plantillas Pro nunca se envía al navegador.
 */
export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const requester = await resolveRequester({ createAnon: true });

  const limited = rateLimit(
    `generate:${requester.user?.id ?? requester.anonId ?? clientIp(request.headers)}`,
    { limit: 20, windowMs: 60_000 },
  );
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento." },
      { status: 429, headers: rateLimitHeaders(limited) },
    );

  const body = await request.json().catch(() => null);
  const extra = extraSchema.safeParse(body ?? {});
  const brand = await resolveBrand(requester, extra.success ? extra.data.clientProfileId : null);

  const res = await generateWorkbookForRequest(slug, body, {
    entitlements: requester.entitlements,
    anonId: requester.anonId,
    usage: defaultUsageStore(),
    brand,
    record: recordDownload,
  });
  if (!res.ok) return NextResponse.json(res.body, { status: res.status });

  return new Response(res.buffer, {
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${res.filename}"`,
      "Cache-Control": "no-store",
      "X-Downloads-Used": String(res.usage.used),
      ...(res.limit !== null ? { "X-Downloads-Limit": String(res.limit) } : {}),
    },
  });
}
