"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPES, CATEGORIES } from "@/templates/categories";
import { filterCatalog } from "@/templates/catalog";
import type { BusinessTypeId, CategoryId, TemplateMeta, TemplateTier } from "@/templates/types";

import { TemplateCard } from "./template-card";

const ALL = "todas";

export function CatalogBrowser({ items }: { items: TemplateMeta[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const category = (params.get("categoria") as CategoryId | null) ?? null;
  const business = (params.get("negocio") as BusinessTypeId | null) ?? null;
  const tier = (params.get("tipo") as TemplateTier | null) ?? null;
  const onlyReady = params.get("disponibles") === "1";

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === ALL) next.delete(k);
      else next.set(k, v);
    }
    startTransition(() =>
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }),
    );
  };

  const results = useMemo(
    () =>
      filterCatalog(
        { query: params.get("q") ?? "", category, businessType: business, tier, onlyReady },
        items,
      ),
    [params, category, business, tier, onlyReady, items],
  );

  const activeFilters = [category, business, tier, params.get("q"), onlyReady ? "1" : null].filter(
    Boolean,
  ).length;

  return (
    <div>
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: query.trim() || null });
        }}
      >
        <label htmlFor="catalogo-buscar" className="sr-only">
          Buscar plantillas
        </label>
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="catalogo-buscar"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              update({ q: e.target.value.trim() || null });
            }}
            placeholder="Buscar por nombre o palabra clave"
            className="h-11 pl-9"
          />
        </div>
      </form>

      <div
        className="-mx-4 mt-4 overflow-x-auto px-4 pb-1"
        role="group"
        aria-label="Filtrar por categoría"
      >
        <div className="flex w-max gap-2">
          <Chip active={!category} onClick={() => update({ categoria: null })}>
            Todas
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => update({ categoria: category === c.id ? null : c.id })}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-negocio">Tipo de negocio</Label>
          <Select value={business ?? ALL} onValueChange={(v) => update({ negocio: v })}>
            <SelectTrigger id="filtro-negocio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los negocios</SelectItem>
              {BUSINESS_TYPES.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-tipo">Plan</Label>
          <Select value={tier ?? ALL} onValueChange={(v) => update({ tipo: v })}>
            <SelectTrigger id="filtro-tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Gratis y Pro</SelectItem>
              <SelectItem value="free">Solo gratis</SelectItem>
              <SelectItem value="pro">Solo Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex h-10 items-center gap-2 text-sm font-medium">
          <Switch
            checked={onlyReady}
            onCheckedChange={(v) => update({ disponibles: v ? "1" : null })}
          />
          Solo disponibles
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {results.length === 1 ? "1 plantilla" : `${results.length} plantillas`}
        </p>
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
          >
            <XIcon />
            Quitar filtros
          </Button>
        )}
      </div>

      {results.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <TemplateCard key={t.slug} meta={t} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border bg-card p-10 text-center">
          <p className="font-heading text-lg font-bold">
            No encontramos plantillas con esos filtros
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Prueba con otra palabra o quita algunos filtros.
          </p>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

/** Versión sin filtros para el HTML inicial (SEO y carga sin JavaScript). */
export function CatalogStatic({ items }: { items: TemplateMeta[] }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <TemplateCard key={t.slug} meta={t} />
      ))}
    </div>
  );
}
