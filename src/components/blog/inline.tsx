import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Interpreta el formato mínimo de los artículos: **negrita**, [texto](/ruta)
 * y `código`. Los enlaces internos usan next/link; los externos se abren en
 * otra pestaña con rel="noopener".
 */
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|`[^`]+`)/g;

export function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split(TOKEN).filter((p) => p !== "");
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      return href!.startsWith("/") ? (
        <Link
          key={i}
          href={href!}
          className="font-medium text-brand-strong underline underline-offset-2"
        >
          {label}
        </Link>
      ) : (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener"
          className="font-medium text-brand-strong underline underline-offset-2"
        >
          {label}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
