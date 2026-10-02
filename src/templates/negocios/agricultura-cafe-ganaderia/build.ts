import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { AgroConfig } from "./form";

export const build: TemplateBuild<AgroConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const crop = config.crop || "Producción";
  const unit = config.unit || "unidad";
  const title = titleWith(`${crop} — ${config.season || "temporada"}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const sumWs = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const costWs = addSheet(wb, "Costos", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const saleWs = addSheet(wb, "Cosecha y ventas", { freezeRows: 4, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "act", title: "Actividades", values: config.activities },
  ]);
  const ex = config.example;
  const act = (i: number) => config.activities[i] ?? config.activities[0] ?? "";

  addSheetHeader(costWs, {
    title: "Costos de producción",
    subtitle: "Cada gasto con su actividad.",
    theme,
    width: 7,
  });
  const costs = addTable(costWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "activity",
        header: "Actividad",
        kind: "list",
        width: 24,
        list: { source: lists.source("act") },
      },
      { key: "detail", header: "Detalle", kind: "text", width: 30 },
      {
        key: "qty",
        header: "Cantidad",
        kind: "number",
        width: 10,
        note: "Jornales, sacos, litros…",
      },
      { key: "unitCost", header: "Costo unitario", kind: "currency", width: 12 },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("activity")}="","",ROUND(N(${r.c("qty")})*N(${r.c("unitCost")}),2))`,
      },
      { key: "note", header: "Nota", kind: "text", width: 18 },
    ],
    rows: config.costs,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total de costos" },
    example: ex
      ? [
          {
            date: fromToday(-200),
            activity: act(2),
            detail: "Fertilizante 18-46-0",
            qty: 20,
            unitCost: 950,
          },
          {
            date: fromToday(-150),
            activity: act(4),
            detail: "Jornales de limpia",
            qty: 40,
            unitCost: 250,
          },
          {
            date: fromToday(-30),
            activity: act(5),
            detail: "Corte (latas)",
            qty: 600,
            unitCost: 35,
          },
        ]
      : undefined,
  });
  const C = (k: string) => costs.sheetRange(k);

  addSheetHeader(saleWs, {
    title: "Cosecha y ventas",
    subtitle: `Producción en ${unit.toLowerCase()} y precio de venta.`,
    theme,
    width: 6,
  });
  const sales = addTable(saleWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "product", header: "Producto o calidad", kind: "text", width: 22 },
      { key: "qty", header: `Cantidad (${unit})`, kind: "number", width: 13, total: "sum" },
      { key: "price", header: `Precio por ${unit.toLowerCase()}`, kind: "currency", width: 14 },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("qty")}="","",ROUND(N(${r.c("qty")})*N(${r.c("price")}),2))`,
      },
      { key: "buyer", header: "Comprador", kind: "text", width: 20 },
    ],
    rows: config.sales,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: fromToday(-20),
            product: "Pergamino seco",
            qty: 60,
            price: 4200,
            buyer: "Cooperativa",
          },
          {
            date: fromToday(-5),
            product: "Pergamino seco",
            qty: 40,
            price: 4350,
            buyer: "Exportadora",
          },
        ]
      : undefined,
  });

  addSheetHeader(sumWs, { title, subtitle: "Rentabilidad de la temporada.", theme, width: 5 });
  const f = addFields(sumWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      { key: "area", label: "Área (manzanas)", kind: "number", value: config.area },
      {
        key: "cost",
        label: "Costo total",
        kind: "calc",
        resultKind: "currency",
        formula: () => costs.sheetTotal("total"),
      },
      {
        key: "costArea",
        label: "Costo por manzana",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `IF(N(${ref("area")})=0,"",ROUND(${ref("cost")}/${ref("area")},2))`,
      },
      {
        key: "prod",
        label: `Producción total (${unit})`,
        kind: "calc",
        resultKind: "number",
        formula: () => sales.sheetTotal("qty"),
      },
      {
        key: "yield",
        label: `Rendimiento (${unit} por manzana)`,
        kind: "calc",
        resultKind: "number",
        formula: (ref) => `IF(N(${ref("area")})=0,"",ROUND(${ref("prod")}/${ref("area")},2))`,
      },
      {
        key: "unitCost",
        label: `Costo por ${unit.toLowerCase()}`,
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `IF(N(${ref("prod")})=0,"",ROUND(${ref("cost")}/${ref("prod")},2))`,
      },
      {
        key: "income",
        label: "Ingresos por ventas",
        kind: "calc",
        resultKind: "currency",
        formula: () => sales.sheetTotal("total"),
      },
      {
        key: "profit",
        label: "Ganancia de la temporada",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${ref("income")}-${ref("cost")}`,
      },
      {
        key: "profitArea",
        label: "Ganancia por manzana",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `IF(N(${ref("area")})=0,"",ROUND(${ref("profit")}/${ref("area")},2))`,
      },
      {
        key: "avgPrice",
        label: `Precio promedio por ${unit.toLowerCase()}`,
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `IF(N(${ref("prod")})=0,"",ROUND(${ref("income")}/${ref("prod")},2))`,
      },
    ],
    theme,
    ctx,
  });
  addCategorySummary(sumWs, {
    startRow: f.nextRow + 2,
    startCol: 1,
    labelHeader: "Actividad",
    sourceCells: cellsOfRange(lists.source("act")),
    values: [
      {
        header: "Costo",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("total")},${C("activity")},${k.labelCell}))`,
      },
      {
        header: "% del costo",
        kind: "percent",
        formula: (k) =>
          `IF(OR(${k.labelCell}="",N(${f.cell("cost")})=0),"",SUMIFS(${C("total")},${C("activity")},${k.labelCell})/${f.cell("cost")})`,
        total: false,
      },
    ],
    theme,
    ctx,
    labelWidth: 28,
  });

  for (const w of [sumWs, costWs, saleWs]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Costos de producción agrícola",
    description:
      "Conoce cuánto te cuesta producir cada manzana y cada unidad, y cuánto ganas en la temporada.",
    steps: [
      "En Resumen confirma el área sembrada en manzanas.",
      "En Costos registra cada gasto con su actividad: cantidad (jornales, sacos, litros) y costo unitario.",
      "En «Cosecha y ventas» registra la producción vendida con su precio.",
      "El costo por manzana, el rendimiento, el costo por unidad y la ganancia se calculan solos.",
    ],
    tips: [
      "Incluye también tu propia mano de obra y la de tu familia como jornales: así conoces el costo real.",
      "Para ganado usa la unidad que vendes (litros de leche, cabezas o libras en pie).",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
