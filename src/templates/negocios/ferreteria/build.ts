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

import type { FerreteriaConfig } from "./form";

export const build: TemplateBuild<FerreteriaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Ferretería", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const inv = addSheet(wb, "Inventario", {
    freezeRows: 7,
    tabColor: theme.primary,
    landscape: true,
  });
  const quote = addSheet(wb, "Cotización", { tabColor: theme.primary });
  const cred = addSheet(wb, "Crédito", { freezeRows: 7, tabColor: theme.primary, landscape: true });
  const lists = addListsSheet(wb, theme, [
    { key: "cat", title: "Categorías", values: config.categories },
  ]);
  const ex = config.example;
  const tax = ctx.taxes.salesTax;
  const stdRate = tax.rates.find((r) => r.id === "standard")?.rate ?? 0;
  const cat0 = config.categories[0] ?? "";
  const cat = (i: number) => config.categories[i] ?? cat0;

  addSheetHeader(inv, {
    title: `${title} — Inventario`,
    subtitle: "Existencia actual, mínimo y precios por producto.",
    theme,
    width: 11,
  });
  const products = addTable(inv, {
    startRow: 7,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 11 },
      { key: "name", header: "Producto", kind: "text", width: 32 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 16,
        list: { source: lists.source("cat") },
      },
      { key: "unit", header: "Unidad", kind: "text", width: 9 },
      { key: "cost", header: "Costo", kind: "currency", width: 12 },
      { key: "price", header: "Precio de venta", kind: "currency", width: 13 },
      {
        key: "margin",
        header: "Margen",
        kind: "formula",
        resultKind: "percent",
        width: 9,
        formula: (r) =>
          `IF(OR(${r.c("code")}="",N(${r.c("price")})=0),"",(${r.c("price")}-N(${r.c("cost")}))/${r.c("price")})`,
      },
      { key: "stock", header: "Existencia", kind: "number", width: 10 },
      { key: "min", header: "Mínimo", kind: "number", width: 9 },
      {
        key: "alert",
        header: "Alerta",
        kind: "formula",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(${r.c("code")}="","",IF(N(${r.c("stock")})<=0,"Agotado",IF(N(${r.c("stock")})<=N(${r.c("min")}),"Pedir","OK")))`,
      },
      {
        key: "value",
        header: "Valor al costo",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("code")}="","",ROUND(MAX(0,N(${r.c("stock")}))*N(${r.c("cost")}),2))`,
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
            code: "CEM-01",
            name: "Cemento gris 42.5 kg",
            category: cat(0),
            unit: "Bolsa",
            cost: 210,
            price: 245,
            stock: 80,
            min: 30,
          },
          {
            code: "VAR-38",
            name: 'Varilla de hierro 3/8"',
            category: cat(0),
            unit: "Unidad",
            cost: 115,
            price: 140,
            stock: 20,
            min: 50,
          },
          {
            code: "CAB-12",
            name: "Cable eléctrico #12 (m)",
            category: cat(1),
            unit: "Metro",
            cost: 14,
            price: 20,
            stock: 0,
            min: 100,
          },
        ]
      : undefined,
  });
  addFields(inv, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "toOrder",
        label: "Productos por pedir",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${products.range("alert")},"Pedir")`,
      },
      {
        key: "out",
        label: "Agotados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${products.range("alert")},"Agotado")`,
      },
    ],
    theme,
    ctx,
  });
  const a = products.letter("alert");
  highlightWhen(
    inv,
    `${a}${products.firstRow}:${a}${products.lastRow}`,
    `${a}${products.firstRow}="Agotado"`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
    1,
  );
  highlightWhen(
    inv,
    `${a}${products.firstRow}:${a}${products.lastRow}`,
    `${a}${products.firstRow}="Pedir"`,
    { fill: theme.warningSoft },
    2,
  );
  const codes = products.sheetRange("code");
  const names = products.sheetRange("name");
  const prices = products.sheetRange("price");
  const stocks = products.sheetRange("stock");

  // Cotización
  addSheetHeader(quote, {
    title: `${title} — Cotización`,
    subtitle: "Escribe el código de cada producto y la cantidad.",
    theme,
    width: 6,
  });
  const q = addFields(quote, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 2,
    fields: [
      { key: "client", label: "Cliente", kind: "text", value: ex ? "Constructora Los Pinos" : "" },
      { key: "date", label: "Fecha", kind: "date", value: fromToday(0) },
      { key: "valid", label: "Válida por (días)", kind: "integer", value: 15 },
      { key: "rate", label: `Tasa de ${tax.name}`, kind: "percent", value: stdRate },
    ],
    theme,
    ctx,
  });
  const lines = addTable(quote, {
    startRow: 9,
    columns: [
      { key: "code", header: "Código", kind: "list", width: 12, list: { source: codes } },
      {
        key: "name",
        header: "Producto",
        kind: "formula",
        width: 34,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${names},MATCH(${r.c("code")},${codes},0)),"Código no existe"))`,
      },
      { key: "qty", header: "Cantidad", kind: "number", width: 10 },
      {
        key: "price",
        header: "Precio",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${prices},MATCH(${r.c("code")},${codes},0)),0))`,
      },
      {
        key: "subtotal",
        header: "Subtotal",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("code")}="","",ROUND(N(${r.c("qty")})*${r.c("price")},2))`,
      },
      {
        key: "available",
        header: "Disponible",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(${r.c("code")}="","",IF(IFERROR(INDEX(${stocks},MATCH(${r.c("code")},${codes},0)),0)>=N(${r.c("qty")}),"Sí","Revisar"))`,
      },
    ],
    rows: config.quoteLines,
    theme,
    ctx,
    totals: { label: "Subtotal" },
    example: ex
      ? [
          { code: "CEM-01", qty: 20 },
          { code: "VAR-38", qty: 40 },
        ]
      : undefined,
  });
  addFields(quote, {
    startRow: lines.totalRow! + 1,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "tax",
        label: tax.name,
        kind: "calc",
        resultKind: "currency",
        formula: () => `ROUND(${lines.total("subtotal")}*${q.cell("rate")},2)`,
      },
      {
        key: "total",
        label: "Total",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${lines.total("subtotal")}+${ref("tax")}`,
      },
    ],
    theme,
    ctx,
  });

  // Crédito
  addSheetHeader(cred, {
    title: `${title} — Ventas al crédito`,
    subtitle: "Cada venta al crédito con su vencimiento y abonos.",
    theme,
    width: 10,
  });
  const credits = addTable(cred, {
    startRow: 7,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "text", width: 24 },
      { key: "doc", header: "Factura o nota", kind: "text", width: 14 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "days", header: "Plazo (días)", kind: "integer", width: 10, fill: 30 },
      {
        key: "due",
        header: "Vence",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("date")}="",${r.c("client")}=""),"",${r.c("date")}+N(${r.c("days")}))`,
      },
      { key: "paid", header: "Abonado", kind: "currency", width: 13, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("client")}="","",N(${r.c("amount")})-N(${r.c("paid")}))`,
      },
      {
        key: "late",
        header: "Días de atraso",
        kind: "formula",
        resultKind: "integer",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("due")}="",N(${r.c("balance")})<=0),"",MAX(0,TODAY()-${r.c("due")}))`,
      },
    ],
    rows: config.credits,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            date: fromToday(-45),
            client: "Constructora Los Pinos",
            doc: "000-001-01-00000120",
            amount: 18500,
            days: 30,
            paid: 10000,
          },
          {
            date: fromToday(-10),
            client: "Don Mario Reyes",
            doc: "000-001-01-00000131",
            amount: 3200,
            days: 30,
          },
        ]
      : undefined,
  });
  addFields(cred, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "receivable",
        label: "Total por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => credits.total("balance"),
      },
      {
        key: "overdue",
        label: "Vencido",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${credits.range("balance")},${credits.range("late")},">0")`,
      },
    ],
    theme,
    ctx,
  });
  const lt = credits.letter("late");
  highlightWhen(
    cred,
    `A${credits.firstRow}:${lt}${credits.lastRow}`,
    `N($${lt}${credits.firstRow})>0`,
    { fill: theme.dangerSoft },
    1,
  );

  await protectSheet(inv);
  await protectSheet(quote);
  await protectSheet(cred);

  addInstructionsSheet(wb, {
    title: "Control de ferretería",
    description: "Inventario, cotizaciones y crédito de tu ferretería en un solo archivo.",
    steps: [
      "En Inventario registra tus productos con código, categoría, costo, precio, existencia y mínimo.",
      "Para cotizar, en Cotización elige el código y escribe la cantidad: producto, precio, ISV y total se llenan solos.",
      "En Crédito anota cada venta al crédito y los abonos; verás el saldo y los días de atraso.",
      "Revisa la columna Alerta del inventario para saber qué pedir.",
    ],
    tips: [
      "Usa códigos cortos y únicos (CEM-01, VAR-38) para cotizar más rápido.",
      "Agrega o cambia categorías en la hoja Listas.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
