import JSZip from "jszip";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isCountryCode } from "@/countries";
import {
  applyClientProfile,
  CLIENT_PROFILE_COLUMNS,
  type ClientProfile,
} from "@/lib/billing/client-profile";
import { createServiceSupabase } from "@/lib/billing/service-client";
import { defaultUsageStore } from "@/lib/billing/usage";
import { generateWorkbookForRequest } from "@/lib/downloads/generate";
import { recordDownload } from "@/lib/downloads/record";
import { resolveRequester } from "@/lib/downloads/requester";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { loadServerTemplate } from "@/templates/registry/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  config: z.record(z.string(), z.unknown()),
  country: z.string().refine(isCountryCode, "País no válido").default("HN"),
  clientProfileIds: z.array(z.string().uuid()).min(1).max(25),
});

function safeName(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 40) || "cliente"
  );
}

/** Descarga por lote (plan Negocio): la misma plantilla para varios clientes en un .zip. */
export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const requester = await resolveRequester();
  if (!requester.user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  if (!requester.entitlements.limits.batchDownload)
    return NextResponse.json(
      { error: "La descarga por lote es parte del plan Negocio.", code: "pro_required" },
      { status: 403 },
    );
  const limited = rateLimit(`batch:${requester.user.id}`, { limit: 5, windowMs: 60_000 });
  if (!limited.ok)
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: rateLimitHeaders(limited) },
    );

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  const template = await loadServerTemplate(slug);
  const db = createServiceSupabase();
  if (!template || !db)
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

  const { data } = await db
    .from("client_profiles")
    .select(CLIENT_PROFILE_COLUMNS)
    .eq("owner_id", requester.user.id)
    .in("id", body.data.clientProfileIds);
  const profiles = (data ?? []) as ClientProfile[];
  if (!profiles.length)
    return NextResponse.json({ error: "Elige al menos un perfil" }, { status: 400 });

  const zip = new JSZip();
  const usage = defaultUsageStore();
  const used = new Set<string>();
  for (const profile of profiles) {
    const config = applyClientProfile(template, body.data.config, profile);
    const res = await generateWorkbookForRequest(
      slug,
      { config, country: body.data.country },
      {
        entitlements: requester.entitlements,
        anonId: null,
        usage,
        brand: { name: profile.name, footer: profile.branding?.footer ?? null },
        source: "batch",
        record: recordDownload,
      },
    );
    if (!res.ok) {
      if (res.status === 400)
        return NextResponse.json(
          {
            error: `La configuración no es válida para «${profile.name}».`,
            issues: res.body.issues,
          },
          { status: 400 },
        );
      return NextResponse.json(res.body, { status: res.status });
    }
    let name = `${safeName(profile.name)}-${res.filename}`;
    for (let i = 2; used.has(name); i++) name = `${safeName(profile.name)}-${i}-${res.filename}`;
    used.add(name);
    zip.file(name, res.buffer);
  }
  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}-lote.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
