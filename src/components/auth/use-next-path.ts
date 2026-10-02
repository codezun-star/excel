"use client";

import { useSearchParams } from "next/navigation";

/** Ruta interna a la que volver después de iniciar sesión (evita redirecciones abiertas). */
export function useNextPath(fallback = "/cuenta"): string {
  const next = useSearchParams().get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
