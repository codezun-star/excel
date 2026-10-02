import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { CamaronConfig } from "./form";

export const build: TemplateBuild<CamaronConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Control de estanques", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const pondWs = addSheet(wb, "Estanques", {
    freezeRows: 8,
    tabColor: theme.primary,
    landscape: true,
  });
  const feedWs = addSheet(wb, "Alimento", { freezeRows: 4, tabColor: theme.primary });
  const costWs = addSheet(wb, "Otros costos", { freezeRows: 4, tabColor: theme.primary });
  const harvWs = addSheet(wb, "Cosechas", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const pStart = 8;
  const ponds = `'Estanques'!$A$${pStart + 1}:$A$${pStart + config.ponds}`;

  addSheetHeader(feedWs, {
    title: "Alimento",
    subtitle: "Libras de alimento y su costo por estanque.",
    theme,
    width: 5,
  });
  const feed = addTable(feedWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "pond", header: "Estanque", kind: "list", width: 14, list: { source: ponds } },
      { key: "lbs", header: "Libras de alimento", kind: "number", width: 14, total: "sum" },
      { key: "cost", header: "Costo", kind: "currency", width: 13, total: "sum" },
      { key: "note", header: "Nota", kind: "text", width: 22 },
    ],
    rows: config.feed,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          { date: fromToday(-80), pond: "E-1", lbs: 3000, cost: 45000 },
          { date: fromToday(-40), pond: "E-1", lbs: 4000, cost: 60000 },
          { date: fromToday(-40), pond: "E-2", lbs: 2500, cost: 37500 },
        ]
      : undefined,
  });
  const F = (k: string) => feed.sheetRange(k);

  addSheetHeader(costWs, {
    title: "Otros costos",
    subtitle: "Mano de obra, combustible, cal, fertilizante, bombeo…",
    theme,
    width: 5,
  });
  const costs = addTable(costWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "pond", header: "Estanque", kind: "list", width: 14, list: { source: ponds } },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 18,
        list: [
          "Mano de obra",
          "Combustible y bombeo",
          "Cal y fertilizante",
          "Mantenimiento",
          "Seguridad",
          "Otro",
        ],
      },
      { key: "detail", header: "Detalle", kind: "text", width: 24 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
    ],
    rows: config.costs,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: fromToday(-60),
            pond: "E-1",
            type: "Mano de obra",
            detail: "Planilla del ciclo",
            amount: 30000,
          },
          {
            date: fromToday(-60),
            pond: "E-2",
            type: "Combustible y bombeo",
            detail: "Diésel",
            amount: 12000,
          },
        ]
      : undefined,
  });
  const O = (k: string) => costs.sheetRange(k);

  addSheetHeader(harvWs, {
    title: "Cosechas",
    subtitle: "Libras cosechadas, peso promedio y precio de venta.",
    theme,
    width: 7,
  });
  const harv = addTable(harvWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "pond", header: "Estanque", kind: "list", width: 14, list: { source: ponds } },
      { key: "lbs", header: "Libras cosechadas", kind: "number", width: 13, total: "sum" },
      { key: "weight", header: "Peso promedio (g)", kind: "number", width: 12 },
      { key: "price", header: "Precio por libra", kind: "currency", width: 12 },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("pond")}="","",ROUND(N(${r.c("lbs")})*N(${r.c("price")}),2))`,
      },
      {
        key: "count",
        header: "Organismos estimados",
        kind: "formula",
        resultKind: "integer",
        width: 14,
        formula: (r) =>
          `IF(OR(${r.c("pond")}="",N(${r.c("weight")})=0),"",ROUND(N(${r.c("lbs")})*453.592/${r.c("weight")},0))`,
      },
    ],
    rows: config.harvests,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          { date: fromToday(-2), pond: "E-1", lbs: 6000, weight: 18, price: 55 },
          { date: fromToday(-1), pond: "E-2", lbs: 2000, weight: 15, price: 50 },
        ]
      : undefined,
  });
  const H = (k: string) => harv.sheetRange(k);

  addSheetHeader(pondWs, {
    title,
    subtitle: "Una fila por estanque y ciclo. Los costos y cosechas se suman solos.",
    theme,
    width: 15,
  });
  const table = addTable(pondWs, {
    startRow: pStart,
    columns: [
      { key: "pond", header: "Estanque", kind: "text", width: 11 },
      { key: "ha", header: "Hectáreas", kind: "number", width: 9 },
      { key: "stocked", header: "Siembra", kind: "date", width: 11 },
      {
        key: "seeds",
        header: "Cantidad sembrada",
        kind: "integer",
        width: 13,
        note: "Larvas o alevines.",
      },
      { key: "seedCost", header: "Costo de semilla", kind: "currency", width: 12 },
      {
        key: "feed",
        header: "Alimento (lb)",
        kind: "formula",
        resultKind: "number",
        width: 11,
        formula: (r) => `IF(${r.c("pond")}="","",SUMIFS(${F("lbs")},${F("pond")},${r.c("pond")}))`,
      },
      {
        key: "cost",
        header: "Costo total",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("pond")}="","",N(${r.c("seedCost")})+SUMIFS(${F("cost")},${F("pond")},${r.c("pond")})+SUMIFS(${O("amount")},${O("pond")},${r.c("pond")}))`,
      },
      {
        key: "lbs",
        header: "Cosechado (lb)",
        kind: "formula",
        resultKind: "number",
        width: 11,
        total: "sum",
        formula: (r) => `IF(${r.c("pond")}="","",SUMIFS(${H("lbs")},${H("pond")},${r.c("pond")}))`,
      },
      {
        key: "income",
        header: "Ingresos",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("pond")}="","",SUMIFS(${H("total")},${H("pond")},${r.c("pond")}))`,
      },
      {
        key: "profit",
        header: "Ganancia",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("pond")}="","",${r.c("income")}-${r.c("cost")})`,
      },
      {
        key: "yield",
        header: "Rendimiento (lb/ha)",
        kind: "formula",
        resultKind: "number",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("pond")}="",N(${r.c("ha")})=0),"",ROUND(${r.c("lbs")}/${r.c("ha")},0))`,
      },
      {
        key: "fcr",
        header: "Conversión alimenticia (FCR)",
        kind: "formula",
        resultKind: "number",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("pond")}="",N(${r.c("lbs")})=0),"",ROUND(${r.c("feed")}/${r.c("lbs")},2))`,
      },
      {
        key: "survival",
        header: "Sobrevivencia",
        kind: "formula",
        resultKind: "percent",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("pond")}="",N(${r.c("seeds")})=0),"",SUMIFS(${H("count")},${H("pond")},${r.c("pond")})/${r.c("seeds")})`,
      },
      { key: "harvested", header: "Cosecha final", kind: "date", width: 11 },
      {
        key: "days",
        header: "Días de cultivo",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("pond")}="",${r.c("stocked")}=""),"",IF(${r.c("harvested")}="",TODAY(),${r.c("harvested")})-${r.c("stocked")})`,
      },
      {
        key: "costLb",
        header: "Costo por libra",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) =>
          `IF(OR(${r.c("pond")}="",N(${r.c("lbs")})=0),"",ROUND(${r.c("cost")}/${r.c("lbs")},2))`,
      },
    ],
    rows: config.ponds,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            pond: "E-1",
            ha: 5,
            stocked: fromToday(-110),
            seeds: 700000,
            seedCost: 21000,
            harvested: fromToday(-2),
          },
          { pond: "E-2", ha: 3, stocked: fromToday(-95), seeds: 400000, seedCost: 12000 },
        ]
      : undefined,
  });
  addFields(pondWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "income",
        label: "Ingresos totales",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("income"),
      },
      {
        key: "profit",
        label: "Ganancia total",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("profit"),
      },
      {
        key: "fcr",
        label: "FCR promedio",
        kind: "calc",
        resultKind: "number",
        formula: () =>
          `IF(${table.total("lbs")}=0,"",ROUND(SUM(${table.range("feed")})/${table.total("lbs")},2))`,
      },
    ],
    theme,
    ctx,
  });
  const pf = table.letter("profit");
  highlightWhen(
    pondWs,
    `${pf}${table.firstRow}:${pf}${table.lastRow}`,
    `AND(${pf}${table.firstRow}<>"",${pf}${table.firstRow}<0)`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );

  for (const w of [pondWs, feedWs, costWs, harvWs]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Control de camaronera y acuicultura",
    description:
      "Mide cada ciclo por estanque: cuánto costó, cuánto produjo y qué tan eficiente fue el alimento.",
    steps: [
      "En Estanques registra cada estanque y ciclo: hectáreas, fecha de siembra, cantidad sembrada y costo de la semilla.",
      "En Alimento y en «Otros costos» registra los gastos eligiendo el estanque.",
      "En Cosechas registra las libras, el peso promedio en gramos y el precio por libra; al terminar el ciclo escribe la fecha de cosecha final en Estanques.",
      "El costo total, la ganancia, el rendimiento por hectárea, el FCR, la sobrevivencia y los días de cultivo se calculan solos.",
    ],
    tips: [
      "FCR = libras de alimento ÷ libras cosechadas: mientras más bajo, más eficiente.",
      "La sobrevivencia se estima con las libras cosechadas y el peso promedio de la muestra.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
