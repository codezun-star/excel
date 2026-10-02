import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import { monthDayFormula } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { PanaderiaConfig } from "./form";

export const build: TemplateBuild<PanaderiaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const { month, year } = config;
  const title = titleWith(`Producción y ventas — ${periodLabel(month, year)}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const resWs = addSheet(wb, "Resumen", { tabColor: theme.primary, landscape: true });
  const prodWs = addSheet(wb, "Producción", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const buyWs = addSheet(wb, "Compras", { freezeRows: 4, tabColor: theme.primary });
  const catWs = addSheet(wb, "Productos", { freezeRows: 4, tabColor: theme.highlight });
  const ex = config.example;
  const d = (day: number) => exampleDate(year, month, day);

  addSheetHeader(catWs, {
    title: "Productos",
    subtitle: "Precio de venta y costo unitario de producción.",
    theme,
    width: 4,
  });
  const products = addTable(catWs, {
    startRow: 4,
    columns: [
      { key: "name", header: "Producto", kind: "text", width: 26 },
      { key: "price", header: "Precio de venta", kind: "currency", width: 13 },
      {
        key: "cost",
        header: "Costo unitario",
        kind: "currency",
        width: 13,
        note: "Lo que cuesta producir una unidad (ingredientes, gas, empaque).",
      },
      {
        key: "margin",
        header: "Margen",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("price")})=0),"",(${r.c("price")}-N(${r.c("cost")}))/${r.c("price")})`,
      },
    ],
    rows: config.products,
    theme,
    ctx,
    example: ex
      ? [
          { name: "Pan francés", price: 3, cost: 1.2 },
          { name: "Semita", price: 15, cost: 6 },
          { name: "Café americano", price: 25, cost: 7 },
        ]
      : undefined,
  });
  const names = products.sheetRange("name");
  const prices = products.sheetRange("price");
  const costs = products.sheetRange("cost");
  const look = (key: string, range: string) =>
    `IFERROR(INDEX(${range},MATCH(${key},${names},0)),0)`;

  addSheetHeader(prodWs, {
    title: "Producción diaria",
    subtitle: "Una fila por producto y día: cuánto produjiste y cuánto vendiste.",
    theme,
    width: 9,
  });
  const prod = addTable(prodWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "product", header: "Producto", kind: "list", width: 24, list: { source: names } },
      { key: "made", header: "Producido", kind: "number", width: 10 },
      { key: "sold", header: "Vendido", kind: "number", width: 10 },
      {
        key: "waste",
        header: "Merma",
        kind: "formula",
        resultKind: "number",
        width: 9,
        formula: (r) => `IF(${r.c("product")}="","",MAX(0,N(${r.c("made")})-N(${r.c("sold")})))`,
      },
      {
        key: "sales",
        header: "Ventas",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("product")}="","",ROUND(N(${r.c("sold")})*${look(r.c("product"), prices)},2))`,
      },
      {
        key: "cost",
        header: "Costo de producción",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("product")}="","",ROUND(N(${r.c("made")})*${look(r.c("product"), costs)},2))`,
      },
      {
        key: "wasteCost",
        header: "Costo de la merma",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("product")}="","",ROUND(${r.c("waste")}*${look(r.c("product"), costs)},2))`,
      },
      {
        key: "profit",
        header: "Ganancia",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("product")}="","",${r.c("sales")}-${r.c("cost")})`,
      },
    ],
    rows: config.production,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          { date: d(1), product: "Pan francés", made: 500, sold: 460 },
          { date: d(1), product: "Semita", made: 60, sold: 52 },
          { date: d(1), product: "Café americano", made: 80, sold: 80 },
          { date: d(2), product: "Pan francés", made: 500, sold: 490 },
        ]
      : undefined,
  });
  const P = (k: string) => prod.sheetRange(k);

  addSheetHeader(buyWs, {
    title: "Compras de insumos",
    subtitle: "Harina, azúcar, huevos, gas, empaques…",
    theme,
    width: 4,
  });
  const buys = addTable(buyWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "item", header: "Insumo", kind: "text", width: 26 },
      { key: "supplier", header: "Proveedor", kind: "text", width: 20 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
    ],
    rows: config.purchases,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [{ date: d(1), item: "Harina (quintal)", supplier: "Molinos", amount: 1450 }]
      : undefined,
  });
  const B = (k: string) => buys.sheetRange(k);

  addSheetHeader(resWs, { title, subtitle: "Por día y por producto.", theme, width: 8 });
  const p = addFields(resWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: year },
      { key: "month", label: "Mes (1 a 12)", kind: "integer", value: month },
    ],
    theme,
    ctx,
  });
  const Y = p.cell("year");
  const M = p.cell("month");
  const inMonth = `${P("date")},">="&DATE(${Y},${M},1),${P("date")},"<="&EOMONTH(DATE(${Y},${M},1),0)`;
  const byProduct = addTable(resWs, {
    startRow: 7,
    columns: [
      {
        key: "name",
        header: "Producto",
        kind: "formula",
        width: 22,
        formula: (r) => `IF(INDEX(${names},${r.index + 1})="","",INDEX(${names},${r.index + 1}))`,
      },
      {
        key: "made",
        header: "Producido",
        kind: "formula",
        resultKind: "number",
        width: 11,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${P("made")},${P("product")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "sold",
        header: "Vendido",
        kind: "formula",
        resultKind: "number",
        width: 11,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${P("sold")},${P("product")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "wastePct",
        header: "% de merma",
        kind: "formula",
        resultKind: "percent",
        width: 11,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("made")})=0),"",MAX(0,${r.c("made")}-${r.c("sold")})/${r.c("made")})`,
      },
      {
        key: "sales",
        header: "Ventas",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${P("sales")},${P("product")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "profit",
        header: "Ganancia",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${P("profit")},${P("product")},${r.c("name")},${inMonth}))`,
      },
    ],
    rows: config.products,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  const wp = byProduct.letter("wastePct");
  highlightWhen(
    resWs,
    `${wp}${byProduct.firstRow}:${wp}${byProduct.lastRow}`,
    `AND(${wp}${byProduct.firstRow}<>"",${wp}${byProduct.firstRow}>0.1)`,
    { fill: theme.warningSoft, bold: true },
    1,
  );
  addTable(resWs, {
    startRow: byProduct.totalRow! + 3,
    columns: [
      {
        key: "date",
        header: "Día",
        kind: "formula",
        resultKind: "date",
        width: 22,
        formula: (r) => monthDayFormula(r.prev("date"), Y, M),
      },
      {
        key: "sales",
        header: "Ventas",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${P("sales")},${P("date")},${r.c("date")}))`,
      },
      {
        key: "cost",
        header: "Costo de producción",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) => `IF(${r.c("date")}="","",SUMIFS(${P("cost")},${P("date")},${r.c("date")}))`,
      },
      {
        key: "purchases",
        header: "Compras de insumos",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${B("amount")},${B("date")},${r.c("date")}))`,
      },
      {
        key: "profit",
        header: "Ganancia",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("date")}="","",${r.c("sales")}-${r.c("cost")})`,
      },
    ],
    rows: 31,
    theme,
    ctx,
    totals: { label: "Total del mes" },
  });
  addFields(resWs, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "sales",
        label: "Ventas del mes",
        kind: "calc",
        resultKind: "currency",
        formula: () => byProduct.total("sales"),
      },
      {
        key: "profit",
        label: "Ganancia del mes",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => byProduct.total("profit"),
      },
    ],
    theme,
    ctx,
  });

  for (const w of [resWs, prodWs, buyWs, catWs]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Control de cafetería y panadería",
    description: "Controla cuánto produces, cuánto vendes y cuánto pierdes en mermas cada día.",
    steps: [
      "En Productos escribe cada producto con su precio de venta y su costo unitario de producción.",
      "En Producción registra por día y producto lo producido y lo vendido: la merma, las ventas y la ganancia se calculan solas.",
      "En Compras anota las compras de insumos.",
      "El Resumen muestra el mes por producto (con % de merma) y por día.",
    ],
    tips: ["Una merma mayor a 10 % se marca en amarillo: ajusta la producción de ese producto."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
