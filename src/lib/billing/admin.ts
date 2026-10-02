import "server-only";

import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/server";

import { createServiceSupabase } from "./service-client";

/** ¿El usuario tiene role = 'admin' en profiles? (consulta con la clave secreta) */
export async function isAdminUser(userId: string): Promise<boolean> {
  const db = createServiceSupabase();
  if (!db) return false;
  const { data } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "admin";
}

/**
 * Exige un administrador. Sin sesión redirige al login; con sesión pero sin
 * rol de admin responde 404 (no revela que la ruta existe).
 */
export async function requireAdmin(nextPath = "/admin"): Promise<User> {
  const session = await getCurrentUser();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (!(await isAdminUser(session.user.id))) notFound();
  return session.user;
}

/** Igual que requireAdmin pero para server actions: devuelve null en lugar de redirigir. */
export async function getAdminOrNull(): Promise<User | null> {
  const session = await getCurrentUser();
  if (!session) return null;
  return (await isAdminUser(session.user.id)) ? session.user : null;
}
