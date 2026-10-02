"use client";

import { LockIcon } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PreviewCell, PreviewData } from "@/lib/excel/preview";
import { colLetter } from "@/lib/excel/refs";
import { cn } from "@/lib/utils";

/** Muestra el workbook generado como una hoja de cálculo en HTML. */
export function WorkbookPreview({ data, className }: { data: PreviewData; className?: string }) {
  const [tab, setTab] = useState(data.sheets[0]?.name ?? "");
  const active = data.sheets.some((s) => s.name === tab) ? tab : (data.sheets[0]?.name ?? "");
  if (!data.sheets.length) return null;
  return (
    <Tabs value={active} onValueChange={setTab} className={className}>
      {data.sheets.map((sheet) => (
        <TabsContent key={sheet.name} value={sheet.name} className="mt-0">
          <div
            className="max-h-[min(70vh,560px)] overflow-auto rounded-lg border bg-background"
            tabIndex={0}
            aria-label={`Vista previa de la hoja ${sheet.name}`}
          >
            <table className="border-separate border-spacing-0 text-[11px] leading-tight sm:text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 w-9 min-w-9 border-r border-b bg-cell-header" />
                  {sheet.widths.map((w, i) => (
                    <th
                      key={i}
                      style={{ width: w, minWidth: Math.min(w, 220) }}
                      className="border-r border-b bg-cell-header px-1 py-0.5 text-center font-mono font-medium text-muted-foreground"
                    >
                      {colLetter(i + 1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row, r) => (
                  <tr key={r} style={{ height: Math.max(18, Math.min(row.height, 60)) }}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-r border-b bg-cell-header px-1 text-center font-mono font-medium text-muted-foreground"
                    >
                      {r + 1}
                    </th>
                    {row.cells.map((cell, c) =>
                      cell.covered ? null : <Cell key={c} cell={cell} />,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {(sheet.truncated || data.limited) && (
              <p className="sticky left-0 flex items-center gap-1.5 border-t bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {data.limited && <LockIcon className="size-3.5" aria-hidden />}
                {data.limited
                  ? "Vista previa limitada. El archivo completo incluye todas las filas, fórmulas y hojas."
                  : `Mostrando las primeras filas y columnas de ${sheet.totalRows} filas.`}
              </p>
            )}
          </div>
        </TabsContent>
      ))}
      <TabsList className="mt-2 h-9 w-full justify-start rounded-md">
        {data.sheets.map((sheet) => (
          <TabsTrigger key={sheet.name} value={sheet.name} className="text-xs">
            {sheet.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function Cell({ cell }: { cell: PreviewCell }) {
  const style: React.CSSProperties = {};
  if (cell.fill && cell.fill.toUpperCase() !== "#FFFFFF") style.backgroundColor = cell.fill;
  if (cell.color) style.color = cell.color;
  if (cell.size && cell.size > 12) style.fontSize = Math.min(cell.size, 20);
  return (
    <td
      colSpan={cell.colSpan}
      rowSpan={cell.rowSpan}
      style={style}
      title={cell.f}
      className={cn(
        "max-w-[260px] truncate border-r border-b px-1.5 py-0.5 align-middle",
        cell.bold && "font-semibold",
        cell.italic && "italic",
        cell.align === "right" && "text-right tabular-nums",
        cell.align === "center" && "text-center",
        cell.t === "masked" && "text-muted-foreground blur-[2px] select-none",
      )}
    >
      {cell.t === "formula" ? (
        <span className="rounded bg-brand-soft/80 px-1 font-mono text-[10px] font-bold text-brand-strong">
          ƒx
        </span>
      ) : (
        cell.v
      )}
    </td>
  );
}
