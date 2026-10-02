import { NextResponse } from "next/server";
import { z } from "zod";

import { templateAccess } from "@/lib/billing/entitlements-core";
import { getPlanCatalog } from "@/lib/billing/plans";
import { defaultUsageStore } from "@/lib/billing/usage";
import { resolveRequester } from "@/lib/downloads/requester";
import { getTemplateMeta } from "@/templates/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resumen de acceso para la interfaz (badges, banner de uso, campos Pro
 * bloqueados). Es solo informativo: cada descarga se vuelve a verificar.
 */
export async function GET(request: Request) {
  const slug = z
    .string()
    .regex(/^[a-z0-9-]{2,80}$/)
    .safeParse(new URL(request.url).searchParams.get("slug"));
  const { user, entitlements: ent, anonId } = await resolveRequester();
  const meta = slug.success ? getTemplateMeta(slug.data) : undefined;
  const used =
    user || anonId
      ? await defaultUsageStore().get({ userId: user?.id ?? null, anonId: user ? null : anonId })
      : 0;
  return NextResponse.json(
    {
      loggedIn: Boolean(user),
      plan: ent.plan,
      planName: ent.planName,
      planValidUntil: ent.planValidUntil,
      limits: ent.limits,
      usage: {
        used,
        limit: ent.downloadLimit,
        remaining: ent.downloadLimit === null ? null : Math.max(ent.downloadLimit - used, 0),
      },
      access: meta ? templateAccess(ent, meta) : null,
      oneTimePriceUsd: (await getPlanCatalog()).oneTime.priceUsd,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
