import { NextResponse } from "next/server";

import { templateAccess } from "@/lib/billing/entitlements-core";
import { buildOptionsFor } from "@/lib/downloads/build-options";
import { resolveRequester } from "@/lib/downloads/requester";
import { workbookToPreview } from "@/lib/excel/preview";
import { buildWorkbook, prepareGeneration } from "@/lib/generation";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vista previa generada en el servidor (plantillas Pro). Sin acceso, la vista
 * es limitada: sin fórmulas y con valores enmascarados después de las
 * primeras filas. No cuenta como descarga.
 */
export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const requester = await resolveRequester();
  const limited = rateLimit(
    `preview:${requester.user?.id ?? requester.anonId ?? clientIp(request.headers)}`,
    { limit: 60, windowMs: 60_000 },
  );
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: rateLimitHeaders(limited) },
    );

  const body = await request.json().catch(() => null);
  const prepared = await prepareGeneration(slug, body);
  if (!prepared.ok)
    return NextResponse.json(
      { error: prepared.error, issues: prepared.issues },
      { status: prepared.status },
    );
  const access = templateAccess(requester.entitlements, prepared.meta);
  const wb = await buildWorkbook(prepared, buildOptionsFor(requester.entitlements));
  const preview = workbookToPreview(wb, access === "none" ? { limited: true } : {});
  return NextResponse.json({ ...preview, access });
}
