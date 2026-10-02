import "server-only";

import { createServiceSupabase } from "@/lib/billing/service-client";

export type AnalyticsEventName =
  "paywall_view" | "checkout_start" | "payment_completed" | "download" | "upgrade_click" | "signup";

export const ANALYTICS_EVENT_NAMES: readonly AnalyticsEventName[] = [
  "paywall_view",
  "checkout_start",
  "payment_completed",
  "download",
  "upgrade_click",
  "signup",
];

/**
 * Guarda un evento de negocio en la tabla `events` (analítica propia, sin
 * servicios de terceros). Nunca lanza: la analítica no debe romper el flujo.
 */
export async function trackEvent(event: {
  name: AnalyticsEventName;
  userId?: string | null;
  anonId?: string | null;
  templateSlug?: string | null;
  props?: Record<string, unknown>;
}): Promise<void> {
  const db = createServiceSupabase();
  if (!db) return;
  try {
    await db.from("events").insert({
      name: event.name,
      user_id: event.userId ?? null,
      anon_id: event.anonId ?? null,
      template_slug: event.templateSlug ?? null,
      props: event.props ?? {},
    });
  } catch {
    // ignorar
  }
}
