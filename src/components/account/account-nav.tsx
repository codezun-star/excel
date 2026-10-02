"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function AccountNav({ showClients }: { showClients?: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/cuenta", label: "Mi cuenta" },
    { href: "/cuenta/suscripcion", label: "Suscripción" },
    ...(showClients ? [{ href: "/cuenta/clientes", label: "Clientes" }] : []),
  ];
  return (
    <nav aria-label="Cuenta" className="mb-6 flex gap-1 border-b">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-brand text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
