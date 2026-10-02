import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogBrowser, CatalogStatic } from "@/components/catalog/catalog-browser";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site";
import { CATALOG } from "@/templates/catalog";
import { templateHref } from "@/components/catalog/template-card";

export const metadata: Metadata = {
  title: "Catálogo de plantillas de Excel para Honduras | Excel Codezun",
  description:
    "Explora plantillas de Excel para facturación, planilla, impuestos, inventario, finanzas personales y más. Gratis y Pro, con fórmulas reales.",
  alternates: { canonical: "/plantillas" },
  openGraph: { url: "/plantillas", title: "Catálogo de plantillas de Excel | Excel Codezun" },
};

export default function CatalogPage() {
  const ready = CATALOG.filter((t) => t.status === "ready");
  return (
    <div className="container-page py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Plantillas de Excel",
          itemListElement: ready.map((t, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(templateHref(t)),
            name: t.title,
          })),
        }}
      />
      <header className="max-w-2xl">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Catálogo de plantillas</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {ready.length} plantillas listas para configurar y descargar, y{" "}
          {CATALOG.length - ready.length} más en camino.
        </p>
      </header>
      <div className="mt-8">
        <Suspense fallback={<CatalogStatic items={CATALOG} />}>
          <CatalogBrowser items={CATALOG} />
        </Suspense>
      </div>
    </div>
  );
}
