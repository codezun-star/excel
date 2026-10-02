import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { es } from "@/i18n/es";
import { ARTICLES } from "@/content/blog";
import { SITE } from "@/lib/site";
import { CATEGORIES } from "@/templates/categories";

const LEGAL = [
  { href: "/aviso-legal", label: "Aviso legal" },
  { href: "/terminos", label: "Términos del servicio" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/reembolsos", label: "Política de reembolsos" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-heading text-lg font-extrabold">{SITE.name}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Plantillas de Excel configurables con fórmulas reales, pensadas para Honduras y
            Latinoamérica.
          </p>
        </div>
        <FooterColumn
          title="Producto"
          links={[
            { href: "/plantillas", label: "Todas las plantillas" },
            { href: "/precios", label: "Precios" },
            { href: "/blog", label: "Guías y blog" },
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: "/cuenta", label: "Mi cuenta" },
          ]}
        />
        <FooterColumn
          title="Categorías"
          links={CATEGORIES.slice(0, 6).map((c) => ({
            href: `/plantillas?categoria=${c.id}`,
            label: c.name,
          }))}
        />
        <FooterColumn
          title="Guías populares"
          links={ARTICLES.slice(0, 6).map((a) => ({
            href: `/blog/${a.slug}`,
            label: a.seoTitle.replace(/ \(.*\)$/, "").replace(/ 2026.*$/, ""),
          }))}
        />
        <FooterColumn title="Legal" links={LEGAL} />
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. {es.footer.madeIn}.
          </p>
          <p>
            Las plantillas fiscales y laborales son herramientas de apoyo y no sustituyen asesoría
            profesional.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="rounded-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
