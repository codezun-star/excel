"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBox({ initial = "", className }: { initial?: string; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      className={`flex w-full gap-2 ${className ?? ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/plantillas?q=${encodeURIComponent(q.trim())}` : "/plantillas");
      }}
    >
      <label htmlFor="buscar-plantilla" className="sr-only">
        Buscar plantilla
      </label>
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="buscar-plantilla"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca: factura, planilla, inventario, décimo cuarto…"
          className="h-12 pl-9 text-base shadow-sm"
          autoComplete="off"
        />
      </div>
      <Button type="submit" size="lg" className="h-12">
        Buscar
      </Button>
    </form>
  );
}
