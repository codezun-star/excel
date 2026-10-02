import { NextResponse } from "next/server";
import { z } from "zod";

import { trackEvent } from "@/lib/analytics/events";
import { resolveRequester } from "@/lib/downloads/requester";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// El navegador solo puede reportar eventos de interfaz; pagos y descargas los registra el servidor.
const bodySchema = z.object({
  name: z.enum(["paywall_view", "upgrade_click"]),
  templateSlug: z
    .string()
    .regex(/^[a-z0-9-]{2,80}$/)
    .nullish(),
  props: z
    .record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export async function POST(request: Request) {
  const limited = rateLimit(`events:${clientIp(request.headers)}`, { limit: 30, windowMs: 60_000 });
  if (!limited.ok) return new NextResponse(null, { status: 204 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  const { user, anonId } = await resolveRequester();
  await trackEvent({
    name: body.data.name,
    userId: user?.id ?? null,
    anonId,
    templateSlug: body.data.templateSlug ?? null,
    props: body.data.props ?? {},
  });
  return new NextResponse(null, { status: 204 });
}
