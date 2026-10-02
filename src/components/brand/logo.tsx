import { cn } from "@/lib/utils";

/** Logotipo: una celda de hoja de cálculo con una "X" de Excel estilizada. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="7" fill="var(--brand)" />
      <path d="M8 8h16v16H8z" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
      <path d="M16 8v16M8 16h16" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
      <path d="m11 11 10 10M21 11 11 21" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="20" y="20" width="6" height="6" rx="1.5" fill="var(--highlight)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-heading text-lg leading-none font-extrabold tracking-tight">
        Excel <span className="text-brand">Codezun</span>
      </span>
    </span>
  );
}
