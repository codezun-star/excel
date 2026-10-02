"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminOrNull } from "@/lib/billing/admin";
import { getPlanCatalog } from "@/lib/billing/plans";
import { createServiceSupabase } from "@/lib/billing/service-client";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email/templates";
import { trackEvent } from "@/lib/analytics/events";
import { getCurrentUser } from "@/lib/supabase/server";
import { describePayment } from "@/payments/describe";
import { MAX_PROOF_BYTES, sniffProofType } from "@/payments/proof";

import type { ActionResult } from "./configs";

const PAYMENT_COLUMNS =
  "id, user_id, kind, plan_code, billing_cycle, template_slug, reference, status";

interface PaymentRow {
  id: string;
  user_id: string;
  kind: string;
  plan_code: string | null;
  billing_cycle: string | null;
  template_slug: string | null;
  reference: string;
  status: string;
}

const uploadSchema = z.object({
  paymentId: z.string().uuid(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Sube el comprobante de una transferencia al bucket privado (con la clave
 * secreta, después de validar dueño, estado, tamaño y tipo real del archivo).
 */
export async function uploadPaymentProof(formData: FormData): Promise<ActionResult> {
  const input = uploadSchema.safeParse({
    paymentId: formData.get("paymentId"),
    notes: formData.get("notes") || undefined,
  });
  const file = formData.get("file");
  if (!input.success || !(file instanceof File)) return { ok: false, error: "Datos inválidos" };
  if (file.size === 0) return { ok: false, error: "Selecciona el archivo del comprobante." };
  if (file.size > MAX_PROOF_BYTES) return { ok: false, error: "El archivo pesa más de 4 MB." };

  const session = await getCurrentUser();
  if (!session) return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Los pagos no están disponibles en este momento." };

  const { data: payment } = await db
    .from("manual_payments")
    .select(PAYMENT_COLUMNS)
    .eq("id", input.data.paymentId)
    .eq("user_id", session.user.id)
    .maybeSingle<PaymentRow>();
  if (!payment) return { ok: false, error: "No encontramos ese pago." };
  if (payment.status !== "pending") return { ok: false, error: "Ese pago ya fue revisado." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffProofType(bytes);
  if (!type) return { ok: false, error: "Sube una imagen (PNG, JPG o WebP) o un PDF." };

  const path = `${session.user.id}/${payment.reference}.${type.ext}`;
  const { error: uploadError } = await db.storage
    .from("payment-proofs")
    .upload(path, bytes, { contentType: type.mime, upsert: true });
  if (uploadError) return { ok: false, error: "No se pudo subir el archivo. Intenta de nuevo." };

  const { error } = await db
    .from("manual_payments")
    .update({ proof_url: path, notes: input.data.notes ?? null })
    .eq("id", payment.id);
  if (error) return { ok: false, error: "No se pudo guardar el comprobante." };

  const description = describePayment(payment);
  if (session.user.email)
    await sendEmail({
      to: session.user.email,
      ...emailTemplates.proofReceived({ reference: payment.reference, description }),
    });
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail)
    await sendEmail({
      to: adminEmail,
      ...emailTemplates.adminNewProof({
        reference: payment.reference,
        description,
        email: session.user.email ?? null,
      }),
    });

  revalidatePath("/cuenta/suscripcion");
  revalidatePath("/admin/pagos");
  return { ok: true };
}

async function userEmail(userId: string): Promise<string | null> {
  const db = createServiceSupabase();
  if (!db) return null;
  const { data } = await db.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

/** Aprueba un pago manual (solo admins): crea la suscripción o la compra y el acceso. */
export async function approveManualPayment(paymentId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(paymentId).success) return { ok: false, error: "Id inválido" };
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Falta la configuración del servidor" };

  const { data: payment } = await db
    .from("manual_payments")
    .select(`${PAYMENT_COLUMNS}, amount`)
    .eq("id", paymentId)
    .maybeSingle<PaymentRow & { amount: number }>();
  if (!payment) return { ok: false, error: "Pago no encontrado" };

  const catalog = await getPlanCatalog();
  const { data, error } = await db.rpc("approve_manual_payment", {
    p_payment_id: paymentId,
    p_admin_id: admin.id,
    p_access_days: catalog.oneTime.accessDays,
  });
  if (error) return { ok: false, error: error.message };

  const result = data as { validUntil?: string | null } | null;
  const email = await userEmail(payment.user_id);
  if (email)
    await sendEmail({
      to: email,
      ...emailTemplates.paymentApproved({
        reference: payment.reference,
        description: describePayment(payment),
        validUntil: result?.validUntil ?? null,
      }),
    });
  await trackEvent({
    name: "payment_completed",
    userId: payment.user_id,
    templateSlug: payment.template_slug,
    props: { provider: "manual", plan: payment.plan_code, amount: Number(payment.amount) },
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}

const rejectSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().trim().min(3, "Escribe el motivo").max(500),
});

/** Rechaza un pago manual con un motivo que se envía al cliente. */
export async function rejectManualPayment(raw: unknown): Promise<ActionResult> {
  const input = rejectSchema.safeParse(raw);
  if (!input.success)
    return { ok: false, error: input.error.issues[0]?.message ?? "Datos inválidos" };
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "No autorizado" };
  const db = createServiceSupabase();
  if (!db) return { ok: false, error: "Falta la configuración del servidor" };

  const { data: payment } = await db
    .from("manual_payments")
    .select(PAYMENT_COLUMNS)
    .eq("id", input.data.paymentId)
    .maybeSingle<PaymentRow>();
  if (!payment) return { ok: false, error: "Pago no encontrado" };

  const { error } = await db.rpc("reject_manual_payment", {
    p_payment_id: input.data.paymentId,
    p_admin_id: admin.id,
    p_reason: input.data.reason,
  });
  if (error) return { ok: false, error: error.message };

  const email = await userEmail(payment.user_id);
  if (email)
    await sendEmail({
      to: email,
      ...emailTemplates.paymentRejected({
        reference: payment.reference,
        description: describePayment(payment),
        reason: input.data.reason,
      }),
    });
  revalidatePath("/admin/pagos");
  return { ok: true };
}
