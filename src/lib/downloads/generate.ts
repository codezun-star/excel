import type { UserEntitlements } from "@/lib/billing/entitlements-core";
import type { UsageResult, UsageStore } from "@/lib/billing/usage";
import { workbookFileName } from "@/lib/excel/filename";
import { buildWorkbook, prepareGeneration } from "@/lib/generation";
import { resolveDefaultConfig } from "@/templates/types";

import { authorizeDownload, type DenyCode } from "./authorize";
import { buildOptionsFor, stripProOnlyFields } from "./build-options";

export interface GenerateDeps {
  entitlements: UserEntitlements;
  anonId: string | null;
  usage: UsageStore;
  brand?: { name: string; footer?: string | null } | null;
  source?: "server" | "batch";
  record?: (input: {
    userId: string | null;
    anonId: string | null;
    templateSlug: string;
    country: string;
    source: "server" | "batch";
  }) => Promise<void>;
}

export type GenerateResult =
  | { ok: true; buffer: ArrayBuffer; filename: string; usage: UsageResult; limit: number | null }
  | {
      ok: false;
      status: number;
      body: { error: string; code?: DenyCode | "invalid"; issues?: unknown; limit?: number | null };
    };

/**
 * Genera un .xlsx en el servidor: valida (Zod), decide el acceso con los
 * entitlements, cuenta la descarga y construye con las opciones del plan.
 */
export async function generateWorkbookForRequest(
  slug: string,
  body: unknown,
  deps: GenerateDeps,
): Promise<GenerateResult> {
  const prepared = await prepareGeneration(slug, body);
  if (!prepared.ok)
    return {
      ok: false,
      status: prepared.status,
      body: { error: prepared.error, code: "invalid", issues: prepared.issues },
    };

  const decision = await authorizeDownload({
    entitlements: deps.entitlements,
    template: prepared.meta,
    anonId: deps.anonId,
    usage: deps.usage,
  });
  if (!decision.ok)
    return {
      ok: false,
      status: decision.status,
      body: { error: decision.message, code: decision.code, limit: decision.limit },
    };

  let config = prepared.config;
  if (!deps.entitlements.limits.customLogo) {
    const proOnly = prepared.template.formFields.filter((f) => f.proOnly).map((f) => f.name);
    if (proOnly.length)
      config = stripProOnlyFields(
        config as Record<string, unknown>,
        proOnly,
        resolveDefaultConfig(prepared.template, prepared.ctx) as Record<string, unknown>,
      );
  }

  const wb = await buildWorkbook(
    { ...prepared, config },
    buildOptionsFor(deps.entitlements, deps.brand),
  );
  const buffer = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  await deps
    .record?.({
      userId: deps.entitlements.userId,
      anonId: deps.anonId,
      templateSlug: slug,
      country: prepared.ctx.code,
      source: deps.source ?? "server",
    })
    .catch(() => undefined);
  return {
    ok: true,
    buffer,
    filename: workbookFileName(slug, prepared.ctx),
    usage: decision.usage,
    limit: decision.limit,
  };
}
