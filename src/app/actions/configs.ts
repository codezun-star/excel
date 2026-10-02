"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCountryContext, isCountryCode, type CountryCode } from "@/countries";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { createServiceSupabase } from "@/lib/billing/service-client";
import { getCurrentUser } from "@/lib/supabase/server";
import { getTemplateMeta } from "@/templates/catalog";
import { FORM_LOADERS } from "@/templates/registry/forms";

const inputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
  name: z.string().trim().min(1, "Escribe un nombre").max(120),
  country: z.string().refine(isCountryCode, "País no válido"),
  config: z.unknown(),
  clientProfileId: z.string().uuid().nullish(),
});

export type ActionResult<T = undefined> =
  { ok: true; data?: T } | { ok: false; error: string; code?: "plan_required" | "login_required" };

/**
 * Guarda la configuración de una plantilla (beneficio de los planes de pago).
 * Se escribe con la clave secreta después de verificar el plan, y se guarda
 * la versión de reglas del país para avisar cuando cambien las tasas.
 */
export async function saveConfiguration(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const input = inputSchema.safeParse(raw);
  if (!input.success) return { ok: false, error: "Datos inválidos" };
  const { slug, name, country, config, clientProfileId } = input.data;
  const meta = getTemplateMeta(slug);
  const loader = FORM_LOADERS[slug];
  if (!meta || meta.status !== "ready" || !loader)
    return { ok: false, error: "Plantilla no disponible" };

  const form = await loader();
  const parsed = form.configSchema.safeParse(config);
  if (!parsed.success) return { ok: false, error: "La configuración tiene errores" };

  const session = await getCurrentUser();
  if (!session)
    return {
      ok: false,
      error: "Inicia sesión para guardar configuraciones",
      code: "login_required",
    };
  const entitlements = await getUserEntitlements(session.user.id);
  if (!entitlements.limits.saveConfigs)
    return {
      ok: false,
      error: "Guardar configuraciones es parte del plan Pro.",
      code: "plan_required",
    };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Guardar no está disponible en este momento." };

  if (clientProfileId) {
    const { data: owned } = await db
      .from("client_profiles")
      .select("id")
      .eq("id", clientProfileId)
      .eq("owner_id", session.user.id)
      .maybeSingle();
    if (!owned) return { ok: false, error: "Perfil de cliente no válido" };
  }

  const ctx = getCountryContext(country as CountryCode);
  const { data, error } = await db
    .from("saved_configs")
    .insert({
      user_id: session.user.id,
      template_slug: slug,
      name,
      country,
      config: parsed.data,
      rules_version: ctx?.rulesVersion ?? null,
      client_profile_id: clientProfileId ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  revalidatePath("/cuenta");
  return { ok: true, data: { id: data.id as string } };
}

/** Elimina una configuración guardada (RLS garantiza que sea del usuario). */
export async function deleteConfiguration(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success)
    return { ok: false, error: "Identificador inválido" };
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Sesión expirada" };
  const { error } = await session.supabase.from("saved_configs").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar" };
  revalidatePath("/cuenta");
  return { ok: true };
}
