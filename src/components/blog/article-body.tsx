import { ArrowRightIcon, InfoIcon, LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

import { TemplateBadges } from "@/components/catalog/tier-badge";
import { Button } from "@/components/ui/button";
import type { Block } from "@/content/blog";
import { canonicalTemplatePath } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { getTemplateMeta } from "@/templates/catalog";

import { CopyFormula } from "./copy-formula";
import { Inline } from "./inline";

const CALLOUT = {
  info: { icon: InfoIcon, className: "border-sky-500/30 bg-sky-500/5" },
  tip: { icon: LightbulbIcon, className: "border-brand/30 bg-brand-soft" },
  warning: { icon: TriangleAlertIcon, className: "border-highlight bg-highlight/10" },
};

function TemplateCta({ block }: { block: Extract<Block, { type: "cta" }> }) {
  const meta = getTemplateMeta(block.template);
  if (!meta) return null;
  return (
    <aside className="not-prose my-8 rounded-2xl border-2 border-brand/40 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="cell-label h-6 rounded px-1.5 text-xs">XLSX</span>
        <TemplateBadges meta={meta} />
      </div>
      <p className="mt-3 font-heading text-lg font-bold">{block.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        <Inline text={block.text} />
      </p>
      <Button asChild className="mt-4">
        <Link href={canonicalTemplatePath(meta)}>
          {meta.tier === "free" ? "Usar la plantilla gratis" : "Ver la plantilla"}
          <ArrowRightIcon />
        </Link>
      </Button>
    </aside>
  );
}

/** Renderiza los bloques de un artículo del blog. */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-article">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} id={block.id} className="scroll-mt-24">
                {block.text}
              </h2>
            );
          case "h3":
            return <h3 key={i}>{block.text}</h3>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <figure key={i} className="not-prose my-6">
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        {block.head.map((h) => (
                          <th key={h} scope="col" className="p-3 text-left font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r} className="border-t">
                          {row.map((cell, c) => (
                            <td key={c} className={cn("p-3", c > 0 && "tabular-nums")}>
                              <Inline text={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-xs text-muted-foreground">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "callout": {
            const { icon: Icon, className } = CALLOUT[block.tone];
            return (
              <div
                key={i}
                className={cn("not-prose my-6 flex gap-3 rounded-xl border p-4 text-sm", className)}
              >
                <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  {block.title && <p className="font-semibold">{block.title}</p>}
                  <p className="leading-relaxed">
                    <Inline text={block.text} />
                  </p>
                </div>
              </div>
            );
          }
          case "cta":
            return <TemplateCta key={i} block={block} />;
          case "formula":
            return (
              <figure key={i} className="not-prose my-6">
                <CopyFormula formula={block.formula} />
                {block.caption && (
                  <figcaption className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    <Inline text={block.caption} />
                  </figcaption>
                )}
              </figure>
            );
          case "steps":
            return (
              <ol key={i} className="not-prose my-6 space-y-4">
                {block.items.map((step, j) => (
                  <li key={j} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-sm font-bold text-white">
                      {j + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-0.5 leading-relaxed text-muted-foreground">
                        <Inline text={step.text} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            );
          case "example":
            return (
              <div key={i} className="not-prose my-6 overflow-hidden rounded-xl border bg-card">
                <p className="border-b bg-muted/50 px-4 py-2 text-sm font-semibold">
                  {block.title}
                </p>
                <dl className="divide-y text-sm">
                  {block.rows.map(([k, v], j) => (
                    <div key={j} className="flex justify-between gap-4 px-4 py-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                  {block.total && (
                    <div className="flex justify-between gap-4 bg-brand-soft px-4 py-2.5 font-bold">
                      <dt>{block.total[0]}</dt>
                      <dd className="text-right tabular-nums">{block.total[1]}</dd>
                    </div>
                  )}
                </dl>
              </div>
            );
        }
      })}
    </div>
  );
}
