"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminOrNull } from "@/lib/billing/admin";
import { invalidatePlanCatalog } from "@/lib/billing/plans";
import { createServiceSupabase } from "@/lib/billing/service-client";

import type { ActionResult } from "./configs";

const grantSchema = z.object({
  userId: z.string().uuid(),
  planCode: z.enum(["pro", "negocio"]),
  months: z.coerce.number().int().min(1).max(36),
});

/** Otorga un plan de cortesía (soporte, alianzas, pruebas). Queda registrado como admin:<id>. */
export async function grantPlan(raw: unknown): Promise<ActionResult> {
  const input = grantSchema.safeParse(raw);
  if (!input.success) return { ok: false, error: "Datos inválidos" };
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Falta la configuración del servidor" };
  const until = new Date();
  until.setMonth(until.getMonth() + input.data.months);
  const { error } = await db.from("entitlements").insert({
    user_id: input.data.userId,
    kind: "plan",
    ref: input.data.planCode,
    valid_until: until.toISOString(),
    source: `admin:${admin.id.slice(0, 8)}:${randomUUID()}`,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

/** Vence de inmediato los accesos de cortesía de un usuario. */
export async function revokeCourtesy(userId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(userId).success) return { ok: false, error: "Id inválido" };
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Falta la configuración del servidor" };
  const { error } = await db
    .from("entitlements")
    .update({ valid_until: new Date().toISOString() })
    .eq("user_id", userId)
    .like("source", "admin:%");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9_-]{3,40}$/, "Código: 3 a 40 letras, números, - o _")),
  percentOff: z.coerce.number().int().min(1).max(100),
  maxRedemptions: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  expiresAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  appliesTo: z.array(z.enum(["pro", "negocio", "compra-unica"])).default([]),
  durationMonths: z.coerce.number().int().min(1).max(36).default(1),
  paddleDiscountId: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || undefined),
});

export async function createCoupon(raw: unknown): Promise<ActionResult> {
  const input = couponSchema.safeParse(raw);
  if (!input.success)
    return { ok: false, error: input.error.issues[0]?.message ?? "Datos inválidos" };
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Falta la configuración del servidor" };
  const d = input.data;
  const { error } = await db.from("coupons").insert({
    code: d.code,
    percent_off: d.percentOff,
    max_redemptions: d.maxRedemptions ?? null,
    expires_at: d.expiresAt ? `${d.expiresAt}T23:59:59-06:00` : null,
    applies_to: d.appliesTo,
    duration_months: d.durationMonths,
    provider_codes: d.paddleDiscountId ? { paddle: d.paddleDiscountId } : {},
  });
  if (error)
    return { ok: false, error: error.code === "23505" ? "Ese código ya existe" : error.message };
  revalidatePath("/admin/cupones");
  return { ok: true };
}

export async function setCouponActive(code: string, active: boolean): Promise<ActionResult> {
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return { ok: false, error: "Código inválido" };
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Falta la configuración del servidor" };
  const { error } = await db.from("coupons").update({ active }).eq("code", code);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/cupones");
  return { ok: true };
}

/** Refresca la caché de planes después de editar precios en la base. */
export async function refreshPlans(): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  invalidatePlanCatalog();
  revalidatePath("/precios");
  return { ok: true };
}
