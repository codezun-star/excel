import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última actualización: {updated}</p>
      <div className="mt-6 max-w-3xl rounded-lg border border-highlight/40 bg-highlight/10 p-4 text-sm">
        Texto base preparado para revisión legal antes de su publicación definitiva.
      </div>
      <article className="prose-legal mt-6">{children}</article>
    </div>
  );
}
