import "server-only";

import { z } from "zod";

import { getCountryContext, isCountryCode, type CountryContext } from "@/countries";
import type { BuildOptions } from "@/lib/excel/workbook";
import { getTemplateMeta } from "@/templates/catalog";
import { loadServerTemplate } from "@/templates/registry/server";
import { appliesToCountry, type AnyTemplateDefinition, type TemplateMeta } from "@/templates/types";

export const generateBodySchema = z.object({
  config: z.unknown(),
  country: z.string().refine(isCountryCode, "País no válido").default("HN"),
});

export type PreparedGeneration =
  | {
      ok: true;
      meta: TemplateMeta;
      template: AnyTemplateDefinition;
      ctx: CountryContext;
      config: unknown;
    }
  | { ok: false; status: number; error: string; issues?: unknown };

/** Valida plantilla, país y configuración antes de generar en el servidor. */
export async function prepareGeneration(slug: string, body: unknown): Promise<PreparedGeneration> {
  const meta = getTemplateMeta(slug);
  if (!meta || meta.status !== "ready")
    return { ok: false, status: 404, error: "Plantilla no encontrada" };
  const parsedBody = generateBodySchema.safeParse(body);
  if (!parsedBody.success)
    return { ok: false, status: 400, error: "Solicitud inválida", issues: parsedBody.error.issues };
  const country = parsedBody.data.country as Parameters<typeof getCountryContext>[0];
  const ctx = getCountryContext(country);
  if (!ctx || !appliesToCountry(meta, country))
    return { ok: false, status: 400, error: "La plantilla no aplica a ese país" };
  const template = await loadServerTemplate(slug);
  if (!template) return { ok: false, status: 404, error: "Plantilla no encontrada" };
  const config = template.configSchema.safeParse(parsedBody.data.config);
  if (!config.success)
    return { ok: false, status: 400, error: "Configuración inválida", issues: config.error.issues };
  return { ok: true, meta, template, ctx, config: config.data };
}

export async function buildWorkbook(
  prepared: Extract<PreparedGeneration, { ok: true }>,
  options: BuildOptions,
) {
  return prepared.template.build(prepared.config, prepared.ctx, options);
}
