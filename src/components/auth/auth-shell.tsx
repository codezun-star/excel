import Link from "next/link";
import type { ReactNode } from "react";

import { LogoMark } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-sheet-grid flex min-h-[calc(100dvh-4rem)] items-start justify-center px-4 py-12 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <Link href="/" className="mb-6 inline-flex" aria-label="Inicio">
          <LogoMark className="size-10" />
        </Link>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && (
          <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
