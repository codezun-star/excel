import {
  templateAccess,
  type TemplateAccess,
  type UserEntitlements,
} from "@/lib/billing/entitlements-core";
import type { UsageResult, UsageStore } from "@/lib/billing/usage";
import type { TemplateTier } from "@/templates/types";

export type DenyCode = "pro_required" | "limit_reached" | "login_required";

export type DownloadDecision =
  | { ok: true; access: TemplateAccess; usage: UsageResult; limit: number | null }
  | { ok: false; status: 401 | 403 | 429; code: DenyCode; message: string; limit: number | null };

/**
 * Decide si se puede descargar una plantilla y, si sí, cuenta la descarga.
 * - Plantilla Pro sin plan ni compra → 403.
 * - Plantilla comprada individualmente → sin límite mensual (ya se pagó).
 * - Resto → límite mensual del plan (anónimos: límite sin cuenta, por cookie).
 */
export async function authorizeDownload(input: {
  entitlements: UserEntitlements;
  template: { slug: string; tier: TemplateTier };
  anonId: string | null;
  usage: UsageStore;
}): Promise<DownloadDecision> {
  const { entitlements: ent, template } = input;
  const access = templateAccess(ent, template);
  if (access === "none") {
    return {
      ok: false,
      status: 403,
      code: "pro_required",
      message: "Esta plantilla es Pro. Elige un plan o cómprala por separado.",
      limit: ent.downloadLimit,
    };
  }

  const limit = access === "purchase" ? null : ent.downloadLimit;
  if (ent.anonymous && !input.anonId) {
    return {
      ok: false,
      status: 401,
      code: "login_required",
      message: "Activa las cookies o inicia sesión para descargar.",
      limit,
    };
  }
  if (limit !== null && limit <= 0) {
    return {
      ok: false,
      status: ent.anonymous ? 401 : 429,
      code: ent.anonymous ? "login_required" : "limit_reached",
      message: "Crea una cuenta gratis para descargar.",
      limit,
    };
  }

  const usage = await input.usage.increment(
    { userId: ent.userId, anonId: ent.userId ? null : input.anonId },
    limit,
  );
  if (!usage.allowed) {
    return {
      ok: false,
      status: 429,
      code: "limit_reached",
      message: ent.anonymous
        ? `Usaste tus ${limit} descargas sin cuenta de este mes. Crea una cuenta gratis para seguir.`
        : `Usaste tus ${limit} descargas de este mes. Pásate a Pro para descargar sin límites.`,
      limit,
    };
  }
  return { ok: true, access, usage, limit };
}
