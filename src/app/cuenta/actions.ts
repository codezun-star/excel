"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isCountryCode } from "@/countries";
import { getCurrentUser } from "@/lib/supabase/server";

import type { ActionResult } from "../actions/configs";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Escribe tu nombre").max(80),
  country: z.string().refine(isCountryCode, "País no válido"),
});

export async function updateProfile(raw: unknown): Promise<ActionResult> {
  const input = profileSchema.safeParse(raw);
  if (!input.success)
    return { ok: false, error: input.error.issues[0]?.message ?? "Datos inválidos" };
  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Sesión expirada" };
  const { error } = await session.supabase
    .from("profiles")
    .update({ full_name: input.data.fullName, country: input.data.country })
    .eq("id", session.user.id);
  if (error) return { ok: false, error: "No se pudo guardar el perfil" };
  revalidatePath("/cuenta");
  return { ok: true };
}
