import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { RopaConfig } from "./form";

export const build: TemplateBuild<RopaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Tienda de ropa", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const invWs = addSheet(wb, "Inventario", {
    freezeRows: 7,
    tabColor: theme.primary,
    landscape: true,
  });
  const saleWs = addSheet(wb, "Ventas", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const layWs = addSheet(wb, "Apartados", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const lists = addListsSheet(wb, theme, [
    { key: "cat", title: "Categorías", values: config.categories },
  ]);
  const ex = config.example;
  const cat = (i: number) => config.categories[i] ?? config.categories[0] ?? "";
  const invStart = 7;
  const codes = `'Inventario'!$A$${invStart + 1}:$A$${invStart + config.products}`;
  const col = (letter: string) =>
    `'Inventario'!$${letter}$${invStart + 1}:$${letter}$${invStart + config.products}`;
  // Columnas del inventario: A código, B prenda, C categoría, D talla, E color, F costo, G precio
  const lookup = (key: string, letter: string) =>
    `IF(${key}="","",IFERROR(INDEX(${col(letter)},MATCH(${key},${codes},0)),"Código no existe"))`;

  addSheetHeader(saleWs, {
    title: "Ventas",
    subtitle: "Elige el código: prenda, talla, color y precio se llenan solos.",
    theme,
    width: 10,
  });
  const sales = addTable(saleWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "code", header: "Código", kind: "list", width: 11, list: { source: codes } },
      {
        key: "item",
        header: "Prenda",
        kind: "formula",
        width: 24,
        formula: (r) => lookup(r.c("code"), "B"),
      },
      {
        key: "size",
        header: "Talla",
        kind: "formula",
        width: 7,
        align: "center",
        formula: (r) => lookup(r.c("code"), "D"),
      },
      {
        key: "color",
        header: "Color",
        kind: "formula",
        width: 10,
        formula: (r) => lookup(r.c("code"), "E"),
      },
      { key: "qty", header: "Cant.", kind: "number", width: 7, align: "center" },
      {
        key: "price",
        header: "Precio",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${col("G")},MATCH(${r.c("code")},${codes},0)),0))`,
      },
      { key: "discount", header: "Descuento", kind: "currency", width: 11, total: "sum" },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("code")}="","",ROUND(N(${r.c("qty")})*N(${r.c("price")})-N(${r.c("discount")}),2))`,
      },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 14,
        list: ["Efectivo", "Tarjeta", "Transferencia"],
      },
    ],
    rows: config.sales,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          { date: fromToday(-2), code: "BL-001-M", qty: 2, method: "Efectivo" },
          { date: fromToday(-1), code: "JN-010-30", qty: 1, discount: 50, method: "Tarjeta" },
        ]
      : undefined,
  });
  const S = (k: string) => sales.sheetRange(k);

  addSheetHeader(layWs, {
    title: "Apartados",
    subtitle: "Prendas separadas con abono. Cambia el estado al retirarlas.",
    theme,
    width: 11,
  });
  const lay = addTable(layWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "text", width: 22 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      { key: "code", header: "Código", kind: "list", width: 11, list: { source: codes } },
      {
        key: "item",
        header: "Prenda",
        kind: "formula",
        width: 22,
        formula: (r) => lookup(r.c("code"), "B"),
      },
      { key: "qty", header: "Cant.", kind: "number", width: 7, align: "center", fill: null },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("code")}="","",ROUND(N(${r.c("qty")})*IFERROR(INDEX(${col("G")},MATCH(${r.c("code")},${codes},0)),0),2))`,
      },
      { key: "paid", header: "Abonado", kind: "currency", width: 12, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("code")}="",${r.c("status")}="Cancelado"),"",${r.c("total")}-N(${r.c("paid")}))`,
      },
      { key: "limit", header: "Fecha límite", kind: "date", width: 12 },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 11,
        list: ["Activo", "Retirado", "Cancelado"],
      },
    ],
    rows: config.layaways,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            date: fromToday(-3),
            client: "Gabriela Ortiz",
            phone: "9555-1234",
            code: "VS-020-S",
            qty: 1,
            paid: 300,
            limit: fromToday(27),
            status: "Activo",
          },
        ]
      : undefined,
  });
  const A = (k: string) => lay.sheetRange(k);
  const lt = lay.letter("limit");
  const ls = lay.letter("status");
  highlightWhen(
    layWs,
    `A${lay.firstRow}:${ls}${lay.lastRow}`,
    `AND($${ls}${lay.firstRow}="Activo",$${lt}${lay.firstRow}<>"",$${lt}${lay.firstRow}<TODAY())`,
    { fill: theme.dangerSoft },
    1,
  );

  addSheetHeader(invWs, {
    title,
    subtitle: "Una fila por prenda, talla y color (cada combinación con su código).",
    theme,
    width: 12,
  });
  const inv = addTable(invWs, {
    startRow: invStart,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 12 },
      { key: "item", header: "Prenda", kind: "text", width: 26 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 14,
        list: { source: lists.source("cat") },
      },
      { key: "size", header: "Talla", kind: "text", width: 7, align: "center" },
      { key: "color", header: "Color", kind: "text", width: 10 },
      { key: "cost", header: "Costo", kind: "currency", width: 11 },
      { key: "price", header: "Precio", kind: "currency", width: 11 },
      {
        key: "stock",
        header: "Existencia",
        kind: "number",
        width: 10,
        note: "Unidades recibidas o contadas.",
      },
      {
        key: "sold",
        header: "Vendido",
        kind: "formula",
        resultKind: "number",
        width: 9,
        formula: (r) => `IF(${r.c("code")}="","",SUMIFS(${S("qty")},${S("code")},${r.c("code")}))`,
      },
      {
        key: "reserved",
        header: "Apartado",
        kind: "formula",
        resultKind: "number",
        width: 9,
        formula: (r) =>
          `IF(${r.c("code")}="","",SUMIFS(${A("qty")},${A("code")},${r.c("code")},${A("status")},"Activo"))`,
      },
      {
        key: "available",
        header: "Disponible",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) =>
          `IF(${r.c("code")}="","",N(${r.c("stock")})-${r.c("sold")}-${r.c("reserved")})`,
      },
      {
        key: "value",
        header: "Valor al costo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("code")}="","",ROUND(MAX(0,${r.c("available")}+${r.c("reserved")})*N(${r.c("cost")}),2))`,
      },
    ],
    rows: config.products,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Valor del inventario" },
    example: ex
      ? [
          {
            code: "BL-001-M",
            item: "Blusa floral",
            category: cat(0),
            size: "M",
            color: "Rosado",
            cost: 220,
            price: 450,
            stock: 6,
          },
          {
            code: "JN-010-30",
            item: "Jeans clásico",
            category: cat(2),
            size: "30",
            color: "Azul",
            cost: 350,
            price: 690,
            stock: 4,
          },
          {
            code: "VS-020-S",
            item: "Vestido casual",
            category: cat(3),
            size: "S",
            color: "Negro",
            cost: 400,
            price: 850,
            stock: 2,
          },
        ]
      : undefined,
  });
  addFields(invWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "sales",
        label: "Ventas registradas",
        kind: "calc",
        resultKind: "currency",
        formula: () => sales.sheetTotal("total"),
      },
      {
        key: "layaway",
        label: "Saldo de apartados activos",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${A("balance")},${A("status")},"Activo")`,
      },
      {
        key: "out",
        label: "Prendas agotadas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${inv.range("available")},"<=0",${inv.range("code")},"<>")`,
      },
    ],
    theme,
    ctx,
  });
  const av = inv.letter("available");
  highlightWhen(
    invWs,
    `${av}${inv.firstRow}:${av}${inv.lastRow}`,
    `AND($A${inv.firstRow}<>"",${av}${inv.firstRow}<=0)`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
    1,
  );

  for (const w of [invWs, saleWs, layWs]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Control de tienda de ropa",
    description:
      "Inventario por talla y color, ventas y apartados sin perder la cuenta de lo disponible.",
    steps: [
      "En Inventario registra cada combinación de prenda, talla y color con su propio código (p. ej. BL-001-M).",
      "En Ventas elige el código y la cantidad; prenda, talla, color y precio aparecen solos.",
      "En Apartados registra las prendas separadas con su abono y fecha límite; al retirarlas cambia el estado a «Retirado» y regístralas en Ventas.",
      "La columna Disponible descuenta lo vendido y lo apartado activo.",
    ],
    tips: ["Los apartados vencidos (fecha límite pasada) se marcan en rojo."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
