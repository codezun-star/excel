"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getUserEntitlements } from "@/lib/billing/entitlements";
import { createServiceSupabase } from "@/lib/billing/service-client";
import { getCurrentUser } from "@/lib/supabase/server";

import type { ActionResult } from "./configs";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullish();

const profileSchema = z.object({
  id: z.string().uuid().nullish(),
  name: z.string().trim().min(1, "Escribe el nombre").max(120),
  rtn: optional(25),
  address: optional(200),
  phone: optional(40),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Correo inválido")
    .transform((v) => v || null)
    .nullish(),
  logo: z
    .string()
    .max(700_000, "El logo es demasiado grande")
    .refine((v) => !v || /^data:image\/(png|jpeg);base64,/.test(v), "Logo inválido")
    .transform((v) => v || null)
    .nullish(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish(),
  footer: optional(120),
});

/** Crea o edita un perfil de cliente respetando el máximo del plan. */
export async function saveClientProfile(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const input = profileSchema.safeParse(raw);
  if (!input.success)
    return { ok: false, error: input.error.issues[0]?.message ?? "Datos inválidos" };
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Inicia sesión", code: "login_required" };
  const ent = await getUserEntitlements(session.user.id);
  if (ent.limits.clientProfiles < 1)
    return {
      ok: false,
      error: "Los perfiles de cliente son parte de Pro y Negocio.",
      code: "plan_required",
    };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "No disponible en este momento" };

  const { id, color, footer, ...fields } = input.data;
  const row = {
    ...fields,
    branding: { ...(color ? { color } : {}), ...(footer ? { footer } : {}) },
  };

  if (id) {
    const { data, error } = await db
      .from("client_profiles")
      .update(row)
      .eq("id", id)
      .eq("owner_id", session.user.id)
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false, error: "No se pudo guardar el perfil" };
    revalidatePath("/cuenta/clientes");
    return { ok: true, data: { id: String(data.id) } };
  }

  const { count } = await db
    .from("client_profiles")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", session.user.id);
  if ((count ?? 0) >= ent.limits.clientProfiles)
    return {
      ok: false,
      error:
        ent.limits.clientProfiles === 1
          ? "Tu plan incluye 1 perfil. Con Negocio puedes tener hasta 25."
          : `Llegaste al máximo de ${ent.limits.clientProfiles} perfiles de tu plan.`,
      code: "plan_required",
    };
  const { data, error } = await db
    .from("client_profiles")
    .insert({ ...row, owner_id: session.user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "No se pudo crear el perfil" };
  revalidatePath("/cuenta/clientes");
  return { ok: true, data: { id: String(data.id) } };
}

export async function deleteClientProfile(id: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Id inválido" };
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Sesión expirada" };
  // RLS permite al dueño borrar sus perfiles.
  const { error } = await session.supabase.from("client_profiles").delete().eq("id", id);
  if (error) return { ok: false, error: "No se pudo eliminar" };
  revalidatePath("/cuenta/clientes");
  return { ok: true };
}
