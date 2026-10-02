import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { trafficLightScale } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { cellsOfRange, addCategorySummary } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ObraConfig } from "./form";

export const build: TemplateBuild<ObraConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith(`Presupuesto: ${config.project || "obra"}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Presupuesto", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "chapters", title: "Capítulos", values: config.chapters, spare: 10 },
  ]);
  const ex = config.example;
  const tax = ctx.taxes.salesTax;
  const stdRate = tax.rates.find((r) => r.id === "standard")?.rate ?? 0;
  const ch = (i: number) => config.chapters[i] ?? config.chapters[0] ?? "";

  addSheetHeader(ws, {
    title,
    subtitle: `${config.client ? `Cliente: ${config.client} · ` : ""}Costos unitarios por renglón; los totales se calculan solos.`,
    theme,
    width: 13,
  });
  const table = addTable(ws, {
    startRow: 4,
    columns: [
      {
        key: "chapter",
        header: "Capítulo",
        kind: "list",
        width: 16,
        list: { source: lists.source("chapters") },
      },
      { key: "code", header: "Código", kind: "text", width: 8 },
      { key: "desc", header: "Descripción del renglón", kind: "text", width: 34, wrap: true },
      { key: "unit", header: "Unidad", kind: "text", width: 8, align: "center" },
      { key: "qty", header: "Cantidad", kind: "number", width: 10 },
      { key: "mat", header: "Materiales (unitario)", kind: "currency", width: 13 },
      { key: "labor", header: "Mano de obra (unitario)", kind: "currency", width: 13 },
      { key: "equip", header: "Equipo (unitario)", kind: "currency", width: 12 },
      {
        key: "unitCost",
        header: "Costo unitario",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(${r.c("desc")}="","",N(${r.c("mat")})+N(${r.c("labor")})+N(${r.c("equip")}))`,
      },
      {
        key: "direct",
        header: "Costo directo",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("desc")}="","",ROUND(N(${r.c("qty")})*${r.c("unitCost")},2))`,
      },
      { key: "progress", header: "Avance", kind: "percent", width: 9 },
      {
        key: "executed",
        header: "Ejecutado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("desc")}="","",ROUND(${r.c("direct")}*N(${r.c("progress")}),2))`,
      },
      {
        key: "materials",
        header: "Total materiales",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("desc")}="","",ROUND(N(${r.c("qty")})*N(${r.c("mat")}),2))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            chapter: ch(0),
            code: "1.01",
            desc: "Limpieza y trazado del terreno",
            unit: "m²",
            qty: 120,
            mat: 5,
            labor: 15,
            equip: 0,
            progress: 1,
          },
          {
            chapter: ch(1),
            code: "2.01",
            desc: "Zapata corrida de concreto 3000 PSI",
            unit: "m³",
            qty: 12,
            mat: 3200,
            labor: 900,
            equip: 250,
            progress: 0.5,
          },
          {
            chapter: ch(3),
            code: "4.01",
            desc: 'Pared de bloque de 6"',
            unit: "m²",
            qty: 180,
            mat: 320,
            labor: 140,
            equip: 0,
            progress: 0,
          },
        ]
      : undefined,
  });
  const pr = table.letter("progress");
  trafficLightScale(ws, `${pr}${table.firstRow}:${pr}${table.lastRow}`);

  addSheetHeader(sum, {
    title: `Resumen — ${config.project || "obra"}`,
    subtitle: "Costo directo, indirectos, impuesto y total.",
    theme,
    width: 5,
  });
  const totals = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "direct",
        label: "Costo directo",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.sheetTotal("direct"),
      },
      {
        key: "adminPct",
        label: "Administración e indirectos (%)",
        kind: "percent",
        value: config.admin / 100,
      },
      {
        key: "admin",
        label: "Administración e indirectos",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `ROUND(${ref("direct")}*${ref("adminPct")},2)`,
      },
      {
        key: "contPct",
        label: "Imprevistos (%)",
        kind: "percent",
        value: config.contingency / 100,
      },
      {
        key: "cont",
        label: "Imprevistos",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `ROUND(${ref("direct")}*${ref("contPct")},2)`,
      },
      { key: "profitPct", label: "Utilidad (%)", kind: "percent", value: config.profit / 100 },
      {
        key: "profit",
        label: "Utilidad",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) =>
          `ROUND((${ref("direct")}+${ref("admin")}+${ref("cont")})*${ref("profitPct")},2)`,
      },
      {
        key: "subtotal",
        label: "Subtotal",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `${ref("direct")}+${ref("admin")}+${ref("cont")}+${ref("profit")}`,
      },
      { key: "taxPct", label: `Tasa de ${tax.name}`, kind: "percent", value: stdRate },
      {
        key: "tax",
        label: tax.name,
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `ROUND(${ref("subtotal")}*${ref("taxPct")},2)`,
      },
      {
        key: "total",
        label: "Total del presupuesto",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${ref("subtotal")}+${ref("tax")}`,
      },
      {
        key: "progress",
        label: "Avance físico-financiero",
        kind: "calc",
        resultKind: "percent",
        formula: (ref) =>
          `IF(${ref("direct")}=0,0,${table.sheetTotal("executed")}/${ref("direct")})`,
      },
    ],
    theme,
    ctx,
  });
  const R = (k: string) => table.sheetRange(k);
  addCategorySummary(sum, {
    startRow: totals.nextRow + 2,
    startCol: 1,
    labelHeader: "Capítulo",
    sourceCells: cellsOfRange(lists.source("chapters")),
    values: [
      {
        header: "Costo directo",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("direct")},${R("chapter")},${k.labelCell}))`,
      },
      {
        header: "Ejecutado",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("executed")},${R("chapter")},${k.labelCell}))`,
      },
      {
        header: "% del total",
        kind: "percent",
        formula: (k) =>
          `IF(OR(${k.labelCell}="",${totals.cell("direct")}=0),"",SUMIFS(${R("direct")},${R("chapter")},${k.labelCell})/${totals.cell("direct")})`,
        total: false,
      },
    ],
    theme,
    ctx,
    labelWidth: 22,
  });

  await protectSheet(ws);
  await protectSheet(sum);

  addInstructionsSheet(wb, {
    title: "Presupuesto de obra",
    description:
      "Arma tu presupuesto por renglones y conoce el total con indirectos, utilidad e impuesto.",
    steps: [
      "En Presupuesto escribe cada renglón: capítulo, descripción, unidad, cantidad y costos unitarios de materiales, mano de obra y equipo.",
      "En Resumen ajusta los porcentajes de administración, imprevistos y utilidad.",
      "El total con impuesto y el resumen por capítulo se calculan solos.",
      "Durante la obra, actualiza la columna Avance de cada renglón para ver lo ejecutado.",
    ],
    tips: [
      "La columna «Total materiales» te sirve para armar el pedido de materiales por capítulo.",
      "Agrega o renombra capítulos en la hoja Listas.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
