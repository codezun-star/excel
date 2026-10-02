"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/pagos", label: "Pagos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/descargas", label: "Descargas" },
  { href: "/admin/cupones", label: "Cupones" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
