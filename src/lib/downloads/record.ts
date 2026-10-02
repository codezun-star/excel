import "server-only";

import { trackEvent } from "@/lib/analytics/events";
import { createServiceSupabase } from "@/lib/billing/service-client";

/** Registra una descarga en `downloads` y en la analítica (con la clave secreta). */
export async function recordDownload(input: {
  userId: string | null;
  anonId: string | null;
  templateSlug: string;
  country: string;
  source: "browser" | "server" | "batch";
}): Promise<void> {
  const db = createServiceSupabase();
  if (db) {
    const { error } = await db.from("downloads").insert({
      user_id: input.userId,
      anon_id: input.userId ? null : input.anonId,
      template_slug: input.templateSlug,
      country: input.country,
      source: input.source,
    });
    if (error) console.error("[downloads] No se pudo registrar:", error.message);
  }
  await trackEvent({
    name: "download",
    userId: input.userId,
    anonId: input.userId ? null : input.anonId,
    templateSlug: input.templateSlug,
    props: { source: input.source, country: input.country },
  });
}
