import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { es } from "@/i18n/es";

import { CountrySelector } from "./country-selector";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export const NAV_LINKS = [
  { href: "/plantillas", label: es.nav.templates },
  { href: "/#categorias", label: es.nav.categories },
  { href: "/#como-funciona", label: es.nav.howItWorks },
  { href: "/precios", label: es.nav.pricing },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <div className="container-page flex h-16 items-center gap-3">
        <MobileNav links={NAV_LINKS} />
        <Link href="/" className="rounded-md" aria-label="Excel Codezun — inicio">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CountrySelector />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
