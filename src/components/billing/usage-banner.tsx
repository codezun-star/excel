"use client";

import { GaugeIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import type { AccessInfo } from "./use-access";

/** "Te quedan X de Y descargas este mes" para el plan gratis. */
export function UsageBanner({
  access,
  className,
}: {
  access: AccessInfo | null;
  className?: string;
}) {
  if (!access || access.plan !== "free" || access.usage.limit === null) return null;
  const { used, limit } = access.usage;
  const remaining = Math.max(limit - used, 0);
  const low = remaining <= 1;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-sm",
        low ? "border-highlight bg-highlight/10" : "bg-muted/50",
        className,
      )}
      role="status"
    >
      <GaugeIcon className="size-4 text-muted-foreground" aria-hidden />
      <span>
        {remaining === 0
          ? "Ya usaste tus descargas gratis de este mes."
          : `Te ${remaining === 1 ? "queda" : "quedan"} ${remaining} de ${limit} descargas gratis este mes${access.loggedIn ? "" : " sin cuenta"}.`}
      </span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border" aria-hidden>
        <div
          className={cn("h-full rounded-full", low ? "bg-highlight" : "bg-brand")}
          style={{ width: `${Math.min(100, (used / Math.max(limit, 1)) * 100)}%` }}
        />
      </div>
      <Link
        href={access.loggedIn ? "/precios" : "/registro"}
        className="ml-auto font-semibold text-brand-strong hover:underline"
      >
        {access.loggedIn ? "Pásate a Pro" : "Crear cuenta gratis"}
      </Link>
    </div>
  );
}
