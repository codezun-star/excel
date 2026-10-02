import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { getCategory } from "@/templates/categories";
import type { TemplateMeta } from "@/templates/types";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "./category-icon";
import { TemplateBadges } from "./tier-badge";

export function templateHref(meta: Pick<TemplateMeta, "slug" | "countries">): string {
  return Array.isArray(meta.countries) && meta.countries.length === 1
    ? `/${meta.countries[0]!.toLowerCase()}/plantillas/${meta.slug}`
    : `/plantillas/${meta.slug}`;
}

export function TemplateCard({ meta, className }: { meta: TemplateMeta; className?: string }) {
  const category = getCategory(meta.category);
  const soon = meta.status === "coming-soon";
  return (
    <Link
      href={templateHref(meta)}
      className={cn(
        "group relative flex h-full flex-col rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md",
        soon && "opacity-80",
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong">
          <CategoryIcon name={category.icon} className="size-5" />
        </span>
        <TemplateBadges meta={meta} className="justify-end" />
      </div>
      <h3 className="font-heading text-base leading-snug font-bold">{meta.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {meta.shortDescription}
      </p>
      <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-brand-strong">
        {soon ? "Ver detalles" : "Configurar y descargar"}
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
