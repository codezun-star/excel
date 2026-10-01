import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, cellsOfRange, ifLabel } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ActivosConfig } from "./form";

export const build: TemplateBuild<ActivosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Activos fijos y depreciación", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Activos", { freezeRows: 6, landscape: true, tabColor: theme.primary });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [],
    tables: [
      {
        key: "life",
        title: "Vida útil por categoría (años)",
        columns: [
          { header: "Categoría", kind: "text", width: 34 },
          { header: "Vida útil (años)", kind: "integer" },
        ],
        rows: [
          ...ctx.taxes.depreciation.map(
            (d) => [d.category, d.usefulLifeYears] as (string | number)[],
          ),
          ["Terrenos (no se deprecian)", 0],
        ],
      },
    ],
  });
  addSheetHeader(ws, {
    title: titleWith("Registro de activos fijos", config.businessName),
    subtitle: "Depreciación en línea recta. Empieza a contar el mes siguiente a la compra.",
    theme,
    width: 12,
  });
  const cut = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [{ key: "cut", label: "Fecha de corte", kind: "date", value: `${config.year}-12-31` }],
    theme,
    ctx,
  });
  const C = cut.cell("cut");
  const life = params.table("life");
  const ex = config.example;
  const table = addTable(ws, {
    startRow: 6,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 10 },
      { key: "desc", header: "Descripción", kind: "text", width: 30 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 28,
        list: { source: params.tableColumn("life", 0) },
      },
      { key: "date", header: "Fecha de compra", kind: "date", width: 12 },
      { key: "cost", header: "Costo", kind: "currency", width: 15, total: "sum" },
      { key: "residual", header: "Valor residual", kind: "currency", width: 13 },
      {
        key: "life",
        header: "Vida útil (años)",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        align: "center",
        formula: (r) =>
          `IF(${r.c("category")}="","",IFERROR(VLOOKUP(${r.c("category")},${life},2,0),0))`,
      },
      {
        key: "annual",
        header: "Depreciación anual",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(OR(${r.c("cost")}="",${r.c("life")}=""),"",IF(${r.c("life")}=0,0,(${r.c("cost")}-${r.c("residual")})/${r.c("life")}))`,
      },
      {
        key: "monthly",
        header: "Depreciación mensual",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) => `IF(${r.c("annual")}="","",${r.c("annual")}/12)`,
      },
      {
        key: "months",
        header: "Meses depreciados",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("date")}="",${r.c("life")}=""),"",MIN(${r.c("life")}*12,MAX(0,(YEAR(${C})-YEAR(${r.c("date")}))*12+MONTH(${C})-MONTH(${r.c("date")}))))`,
      },
      {
        key: "accum",
        header: "Depreciación acumulada",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("months")}="","",ROUND(MIN(${r.c("cost")}-${r.c("residual")},${r.c("monthly")}*${r.c("months")}),2))`,
      },
      {
        key: "book",
        header: "Valor en libros",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) => `IF(${r.c("accum")}="","",${r.c("cost")}-${r.c("accum")})`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 36,
    example: ex
      ? [
          {
            code: "VEH-01",
            desc: "Pickup Toyota Hilux",
            category: ctx.taxes.depreciation.find((d) => d.category === "Vehículos")?.category,
            date: `${config.year - 2}-06-15`,
            cost: 720_000,
            residual: 120_000,
          },
          {
            code: "COM-01",
            desc: "Computadora portátil",
            category: ctx.taxes.depreciation.find((d) => d.category === "Equipo de cómputo")
              ?.category,
            date: `${config.year}-01-10`,
            cost: 24_000,
            residual: 0,
          },
        ]
      : undefined,
  });

  addSheetHeader(summary, {
    title: "Resumen por categoría",
    subtitle: "A la fecha de corte de la hoja Activos.",
    theme,
    width: 4,
  });
  addCategorySummary(summary, {
    startRow: 4,
    startCol: 1,
    labelHeader: "Categoría",
    labelWidth: 32,
    sourceCells: cellsOfRange(params.tableColumn("life", 0)),
    values: [
      {
        header: "Costo",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIF(${table.sheetRange("category")},${k.labelCell},${table.sheetRange("cost")})`,
          ),
      },
      {
        header: "Depreciación acumulada",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIF(${table.sheetRange("category")},${k.labelCell},${table.sheetRange("accum")})`,
          ),
      },
      {
        header: "Valor en libros",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIF(${table.sheetRange("category")},${k.labelCell},${table.sheetRange("book")})`,
          ),
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);
  await protectSheet(summary);

  addInstructionsSheet(wb, {
    title: "Activos fijos y depreciación",
    description:
      "Controla tus activos fijos y calcula su depreciación en línea recta para tus estados financieros.",
    steps: [
      "Revisa en Parámetros la vida útil de cada categoría; ajústala si tu contador indica otra.",
      "Registra cada activo con su categoría, fecha de compra, costo y valor residual (lo que valdrá al final de su vida útil).",
      "La depreciación anual, mensual, acumulada y el valor en libros se calculan a la fecha de corte.",
      "La hoja Resumen agrupa los montos por categoría para tu registro contable.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
