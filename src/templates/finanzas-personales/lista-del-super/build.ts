import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { SuperConfig } from "./form";

export const build: TemplateBuild<SuperConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Lista del súper", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Lista", { freezeRows: 8, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "aisle", title: "Pasillos", values: config.aisles },
  ]);
  const ex = config.example;
  const a = (i: number) => config.aisles[i] ?? config.aisles[0] ?? "";

  addSheetHeader(ws, {
    title,
    subtitle: "Ordena por pasillo (filtro) para recorrer el súper una sola vez.",
    theme,
    width: 9,
  });
  const f = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "budget", label: "Presupuesto", kind: "currency", value: config.budget }],
    theme,
    ctx,
  });
  const table = addTable(ws, {
    startRow: 8,
    columns: [
      {
        key: "aisle",
        header: "Pasillo",
        kind: "list",
        width: 18,
        list: { source: lists.source("aisle") },
      },
      { key: "product", header: "Producto", kind: "text", width: 26 },
      { key: "qty", header: "Cantidad", kind: "number", width: 9 },
      { key: "unit", header: "Unidad", kind: "text", width: 9 },
      { key: "price", header: "Precio estimado", kind: "currency", width: 12 },
      {
        key: "est",
        header: "Subtotal estimado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("product")}="","",ROUND(N(${r.c("qty")})*N(${r.c("price")}),2))`,
      },
      {
        key: "done",
        header: "¿Comprado?",
        kind: "list",
        width: 10,
        list: ["Sí", "No"],
        align: "center",
      },
      { key: "real", header: "Precio real", kind: "currency", width: 11 },
      {
        key: "realTotal",
        header: "Subtotal real",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("product")}="",${r.c("done")}<>"Sí"),"",ROUND(N(${r.c("qty")})*IF(${r.c("real")}="",N(${r.c("price")}),${r.c("real")}),2))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          { aisle: a(0), product: "Tomate", qty: 3, unit: "lb", price: 18, done: "Sí", real: 20 },
          { aisle: a(0), product: "Plátanos", qty: 6, unit: "unid.", price: 5, done: "Sí" },
          { aisle: a(2), product: "Leche", qty: 4, unit: "litro", price: 32, done: "No" },
          { aisle: a(4), product: "Arroz", qty: 5, unit: "lb", price: 14, done: "Sí" },
        ]
      : undefined,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "est",
        label: "Total estimado",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("est"),
      },
      {
        key: "real",
        label: "Gastado hasta ahora",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("realTotal"),
      },
      {
        key: "left",
        label: "Te queda del presupuesto",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${f.cell("budget")}-${table.total("realTotal")}`,
      },
      {
        key: "pending",
        label: "Productos por comprar",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${table.range("product")},"<>",${table.range("done")},"<>Sí")`,
      },
    ],
    theme,
    ctx,
  });
  const R = (k: string) => table.sheetRange(k);
  addCategorySummary(ws, {
    startRow: table.totalRow! + 3,
    startCol: 1,
    labelHeader: "Pasillo",
    sourceCells: cellsOfRange(lists.source("aisle")),
    values: [
      {
        header: "Estimado",
        kind: "currency",
        formula: (k) => `IF(${k.labelCell}="","",SUMIFS(${R("est")},${R("aisle")},${k.labelCell}))`,
      },
      {
        header: "Real",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("realTotal")},${R("aisle")},${k.labelCell}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 20,
  });
  const dn = table.letter("done");
  highlightWhen(
    ws,
    `A${table.firstRow}:${table.letter("realTotal")}${table.lastRow}`,
    `$${dn}${table.firstRow}="Sí"`,
    { color: theme.muted, fill: theme.okSoft },
    1,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Lista del súper",
    description: "Compra solo lo que necesitas y no te pases del presupuesto.",
    steps: [
      "Escribe tu presupuesto y agrega cada producto con su pasillo, cantidad y precio estimado.",
      "En el súper marca «Sí» en ¿Comprado? y escribe el precio real si cambió.",
      "Arriba ves cuánto llevas gastado y cuánto te queda del presupuesto.",
    ],
    tips: ["Guarda tu lista base y solo cambia las cantidades cada quincena."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
