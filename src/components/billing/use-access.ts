"use client";

import { useCallback, useEffect, useState } from "react";

import type { PlanCode, PlanLimits } from "@/config/plans";
import type { TemplateAccess } from "@/lib/billing/entitlements-core";

export interface AccessInfo {
  loggedIn: boolean;
  plan: PlanCode;
  planName: string;
  planValidUntil: string | null;
  limits: PlanLimits;
  usage: { used: number; limit: number | null; remaining: number | null };
  access: TemplateAccess | null;
  oneTimePriceUsd: number;
}

/** Resumen de acceso del usuario actual (solo para la interfaz; el servidor decide). */
export function useAccess(slug?: string) {
  const [info, setInfo] = useState<AccessInfo | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/me/access${slug ? `?slug=${slug}` : ""}`, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<AccessInfo>) : null))
      .then((data) => {
        if (!cancelled && data) setInfo(data);
      })
      .catch(() => undefined); // sin conexión: la interfaz usa valores por defecto
    return () => {
      cancelled = true;
    };
  }, [slug, version]);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { access: info, refresh };
}

/** Reporta un evento de interfaz (paywall_view, upgrade_click) sin bloquear. */
export function reportEvent(
  name: "paywall_view" | "upgrade_click",
  templateSlug?: string | null,
  props?: Record<string, string | number | boolean | null>,
): void {
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, templateSlug: templateSlug ?? null, props }),
      keepalive: true,
    });
  } catch {
    // ignorar
  }
}
