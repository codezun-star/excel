"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { es } from "@/i18n/es";

export function MobileNav({ links }: { links: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label={es.nav.menu}>
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Móvil" className="flex flex-col gap-1 px-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/cuenta"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
          >
            {es.nav.account}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
