import { NextResponse } from "next/server";
import { z } from "zod";

import { isCountryCode } from "@/countries";
import { defaultUsageStore } from "@/lib/billing/usage";
import { authorizeDownload } from "@/lib/downloads/authorize";
import { buildOptionsFor } from "@/lib/downloads/build-options";
import { recordDownload } from "@/lib/downloads/record";
import { resolveBrand, resolveRequester } from "@/lib/downloads/requester";
import { clientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getTemplateMeta } from "@/templates/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
  country: z.string().refine(isCountryCode, "País no válido").default("HN"),
  clientProfileId: z.string().uuid().nullish(),
});

/**
 * Autoriza y registra la descarga de una plantilla GRATIS (que se genera en el
 * navegador). Aplica el límite mensual a cuentas gratis y a anónimos (cookie
 * firmada) y devuelve las opciones de construcción del plan (marca de agua).
 */
export async function POST(request: Request) {
  const requester = await resolveRequester({ createAnon: true });
  const limited = rateLimit(
    `downloads:${requester.user?.id ?? requester.anonId ?? clientIp(request.headers)}`,
    { limit: 20, windowMs: 60_000 },
  );
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera un momento." },
      { status: 429, headers: rateLimitHeaders(limited) },
    );

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "Solicitud inválida", issues: body.error.issues },
      { status: 400 },
    );
  const meta = getTemplateMeta(body.data.slug);
  if (!meta || meta.status !== "ready")
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  if (meta.tier !== "free")
    return NextResponse.json(
      { error: "Las plantillas Pro se generan en el servidor (/api/generate)." },
      { status: 400 },
    );

  const decision = await authorizeDownload({
    entitlements: requester.entitlements,
    template: meta,
    anonId: requester.anonId,
    usage: defaultUsageStore(),
  });
  if (!decision.ok)
    return NextResponse.json(
      { error: decision.message, code: decision.code, limit: decision.limit },
      { status: decision.status },
    );

  await recordDownload({
    userId: requester.user?.id ?? null,
    anonId: requester.anonId,
    templateSlug: meta.slug,
    country: body.data.country,
    source: "browser",
  });
  return NextResponse.json({
    ok: true,
    buildOptions: buildOptionsFor(
      requester.entitlements,
      await resolveBrand(requester, body.data.clientProfileId),
    ),
    usage: {
      used: decision.usage.used,
      limit: decision.limit,
      remaining: decision.usage.remaining,
    },
  });
}
