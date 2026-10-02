import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { LotesConfig } from "./form";

/** Fecha ISO a `days` días de hoy (para que los datos de ejemplo siempre muestren alertas). */
function fromToday(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const build: TemplateBuild<LotesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Inventario por lote y vencimiento", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Lotes", { freezeRows: 10, tabColor: theme.primary, landscape: true });
  const out = addSheet(wb, "Salidas", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const startRow = 10;
  const lotRange = `'Lotes'!$B$${startRow + 1}:$B$${startRow + config.lots}`;
  const prodRange = `'Lotes'!$A$${startRow + 1}:$A$${startRow + config.lots}`;

  addSheetHeader(out, {
    title: "Salidas por lote",
    subtitle: "Ventas, mermas y devoluciones: elige siempre el lote que sale primero.",
    theme,
    width: 6,
  });
  const moves = addTable(out, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "lot", header: "Lote", kind: "list", width: 16, list: { source: lotRange } },
      {
        key: "product",
        header: "Producto",
        kind: "formula",
        width: 28,
        formula: (r) =>
          `IF(${r.c("lot")}="","",IFERROR(INDEX(${prodRange},MATCH(${r.c("lot")},${lotRange},0)),"Lote no existe"))`,
      },
      { key: "qty", header: "Cantidad", kind: "number", width: 11 },
      {
        key: "reason",
        header: "Motivo",
        kind: "list",
        width: 14,
        list: ["Venta", "Merma", "Vencido", "Devolución"],
      },
      { key: "note", header: "Nota", kind: "text", width: 24 },
    ],
    rows: config.movements,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          { date: fromToday(-10), lot: "L-2401", qty: 20, reason: "Venta" },
          { date: fromToday(-5), lot: "L-2402", qty: 5, reason: "Venta" },
          { date: fromToday(-2), lot: "L-2403", qty: 2, reason: "Merma" },
        ]
      : undefined,
  });
  const mLot = moves.sheetRange("lot");
  const mQty = moves.sheetRange("qty");

  addSheetHeader(ws, {
    title,
    subtitle: "Cada fila es un lote. Las existencias se calculan con las salidas.",
    theme,
    width: 11,
  });
  const lots = addTable(ws, {
    startRow,
    columns: [
      { key: "product", header: "Producto", kind: "text", width: 28 },
      { key: "lot", header: "Lote", kind: "text", width: 14 },
      { key: "received", header: "Fecha de ingreso", kind: "date", width: 12 },
      { key: "expires", header: "Vence", kind: "date", width: 12 },
      { key: "qtyIn", header: "Cantidad recibida", kind: "number", width: 12 },
      { key: "cost", header: "Costo unitario", kind: "currency", width: 13 },
      {
        key: "out",
        header: "Salidas",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) => `IF(${r.c("lot")}="","",SUMIFS(${mQty},${mLot},${r.c("lot")}))`,
      },
      {
        key: "stock",
        header: "Existencia",
        kind: "formula",
        resultKind: "number",
        width: 11,
        formula: (r) => `IF(${r.c("lot")}="","",N(${r.c("qtyIn")})-${r.c("out")})`,
      },
      {
        key: "days",
        header: "Días para vencer",
        kind: "formula",
        resultKind: "integer",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("lot")}="",${r.c("expires")}=""),"",${r.c("expires")}-TODAY())`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("days")}="","",IF(${r.c("stock")}<=0,"Agotado",IF(${r.c("days")}<0,"Vencido",IF(${r.c("days")}<=$B$4,"Por vencer","OK"))))`,
      },
      {
        key: "value",
        header: "Valor",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("lot")}="","",MAX(0,${r.c("stock")})*N(${r.c("cost")}))`,
      },
    ],
    rows: config.lots,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Valor total" },
    example: ex
      ? [
          {
            product: "Acetaminofén 500 mg (caja)",
            lot: "L-2401",
            received: fromToday(-120),
            expires: fromToday(240),
            qtyIn: 100,
            cost: 45,
          },
          {
            product: "Leche entera 1 L",
            lot: "L-2402",
            received: fromToday(-20),
            expires: fromToday(15),
            qtyIn: 24,
            cost: 32,
          },
          {
            product: "Yogur de fresa",
            lot: "L-2403",
            received: fromToday(-30),
            expires: fromToday(-3),
            qtyIn: 12,
            cost: 18,
          },
        ]
      : undefined,
  });

  const st = lots.range("status");
  const val = lots.range("value");
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "today",
        label: "Fecha de hoy",
        kind: "calc",
        resultKind: "date",
        formula: () => "TODAY()",
      },
      {
        key: "alert",
        label: "Avisar cuando falten (días)",
        kind: "integer",
        value: config.alertDays,
      },
      {
        key: "expired",
        label: "Lotes vencidos con existencia",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${st},"Vencido")`,
      },
      {
        key: "soon",
        label: "Lotes por vencer",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${st},"Por vencer")`,
      },
      {
        key: "risk",
        label: "Valor vencido o por vencer",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `SUMIFS(${val},${st},"Vencido")+SUMIFS(${val},${st},"Por vencer")`,
      },
    ],
    theme,
    ctx,
  });
  const s = lots.letter("status");
  const range = `A${lots.firstRow}:${lots.letter("value")}${lots.lastRow}`;
  highlightWhen(
    ws,
    range,
    `$${s}${lots.firstRow}="Vencido"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(ws, range, `$${s}${lots.firstRow}="Por vencer"`, { fill: theme.warningSoft }, 2);
  highlightWhen(ws, range, `$${s}${lots.firstRow}="Agotado"`, { color: theme.muted }, 3);
  await protectSheet(ws);
  await protectSheet(out);

  addInstructionsSheet(wb, {
    title: "Inventario por lote y vencimiento",
    description:
      "Evita pérdidas por productos vencidos: sabe qué lote vence primero y cuánto dinero está en riesgo.",
    steps: [
      "En Lotes registra cada lote recibido: producto, número de lote, fechas, cantidad y costo.",
      "En Salidas registra ventas, mermas o devoluciones eligiendo el lote.",
      "La existencia, los días para vencer y el estado se calculan solos con la fecha de hoy.",
      "Ajusta en B4 los días de aviso para marcar lotes «Por vencer».",
    ],
    tips: [
      "Vende primero lo que vence primero (PEPS / FEFO): filtra por «Vence» de menor a mayor.",
      "Si un producto no tiene lote del proveedor, usa la fecha de ingreso como lote (p. ej. 2026-03-15).",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
