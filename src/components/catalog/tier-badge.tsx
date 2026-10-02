import { LockIcon, SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { es } from "@/i18n/es";
import type { TemplateMeta } from "@/templates/types";

/** Insignias coherentes: Gratis (verde), Pro (ámbar), Próximamente (gris). */
export function TemplateBadges({
  meta,
  className,
}: {
  meta: Pick<TemplateMeta, "tier" | "status">;
  className?: string;
}) {
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {meta.status === "coming-soon" && <Badge variant="soon">{es.badges.soon}</Badge>}
      {meta.tier === "pro" ? (
        <Badge variant="pro">
          <SparklesIcon />
          {es.badges.pro}
        </Badge>
      ) : (
        <Badge variant="free">{es.badges.free}</Badge>
      )}
    </span>
  );
}

export function ProLock() {
  return (
    <Badge variant="pro" className="gap-1">
      <LockIcon />
      {es.badges.pro}
    </Badge>
  );
}
