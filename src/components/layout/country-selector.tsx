"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/countries";
import { es } from "@/i18n/es";

/** Selector de país: solo los países activos se pueden elegir. */
export function CountrySelector() {
  const pathname = usePathname();
  const fromPath = COUNTRIES.find((c) => pathname?.startsWith(`/${c.slug}/`))?.code;
  const current = COUNTRIES.find((c) => c.code === (fromPath ?? DEFAULT_COUNTRY))!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${es.country.label}: ${current.name}`}
          className="gap-1.5"
        >
          <span className="cell-label h-5 rounded-sm px-1">{current.code}</span>
          <span className="hidden sm:inline">{current.name}</span>
          <ChevronDownIcon className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{es.country.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COUNTRIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            disabled={c.status !== "active"}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="cell-label h-5 w-7 rounded-sm">{c.code}</span>
              {c.name}
            </span>
            {c.status === "active" ? (
              c.code === current.code && <CheckIcon className="text-brand" />
            ) : (
              <Badge variant="soon">{es.country.soon}</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
