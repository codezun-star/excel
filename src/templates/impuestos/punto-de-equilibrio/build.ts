import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { EquilibrioConfig } from "./form";

const SCENARIOS = 11;

export const build: TemplateBuild<EquilibrioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Punto de equilibrio", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Punto de equilibrio", { tabColor: theme.primary });
  [34, 18, 3, 16, 16, 16, 16].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  addSheetHeader(ws, {
    title: titleWith("Punto de equilibrio", config.businessName),
    subtitle: config.product,
    theme,
    width: 7,
  });
  const fixedExample = [8000, 24000, 3500, 1200, 3300];
  const fixed = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "concept", header: "Costos fijos mensuales", kind: "text", width: 34 },
      { key: "amount", header: "Monto", kind: "currency", width: 18, total: "sum" },
    ],
    rows: config.fixedCosts.length + 3,
    theme,
    ctx,
    totals: { label: "Total costos fijos" },
    example: config.fixedCosts.map((concept, i) => ({
      concept,
      amount: config.example ? (fixedExample[i] ?? 0) : null,
    })),
  });
  const inputs = addFields(ws, {
    startRow: (fixed.totalRow ?? fixed.lastRow) + 2,
    labelCol: 1,
    valueCol: 2,
    title: "Precio y costo variable",
    fields: [
      { key: "price", label: "Precio de venta por unidad", kind: "currency", value: config.price },
      {
        key: "variable",
        label: "Costo variable por unidad",
        kind: "currency",
        value: config.variableCost,
      },
      {
        key: "target",
        label: "Utilidad mensual deseada",
        kind: "currency",
        value: config.targetProfit,
      },
    ],
    theme,
    ctx,
  });
  const res = addFields(ws, {
    startRow: inputs.nextRow + 1,
    labelCol: 1,
    valueCol: 2,
    title: "Resultados",
    fields: [
      {
        key: "mc",
        label: "Margen de contribución por unidad",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${inputs.cell("price")}-${inputs.cell("variable")}`,
      },
      {
        key: "mcPct",
        label: "Margen de contribución (%)",
        kind: "calc",
        resultKind: "percent",
        formula: (r) => `IFERROR(${r("mc")}/${inputs.cell("price")},0)`,
      },
      {
        key: "units",
        label: "Punto de equilibrio (unidades al mes)",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: (r) =>
          `IF(${r("mc")}<=0,"Precio muy bajo",ROUNDUP(${fixed.total("amount")}/${r("mc")},0))`,
      },
      {
        key: "sales",
        label: "Punto de equilibrio (ventas al mes)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => `IF(${r("mc")}<=0,0,${fixed.total("amount")}/${r("mcPct")})`,
      },
      {
        key: "unitsTarget",
        label: "Unidades para la utilidad deseada",
        kind: "calc",
        resultKind: "integer",
        formula: (r) =>
          `IF(${r("mc")}<=0,"Precio muy bajo",ROUNDUP((${fixed.total("amount")}+${inputs.cell("target")})/${r("mc")},0))`,
      },
      {
        key: "salesTarget",
        label: "Ventas para la utilidad deseada",
        kind: "calc",
        resultKind: "currency",
        formula: (r) =>
          `IF(${r("mc")}<=0,0,(${fixed.total("amount")}+${inputs.cell("target")})/${r("mcPct")})`,
      },
      {
        key: "daily",
        label: "Unidades por día para el equilibrio (30 días)",
        kind: "calc",
        resultKind: "number",
        formula: (r) => `IFERROR(${r("units")}/30,"")`,
      },
    ],
    theme,
    ctx,
  });
  const be = res.cell("units");
  const scen = addTable(ws, {
    startRow: 4,
    startCol: 4,
    columns: [
      {
        key: "units",
        header: "Unidades vendidas",
        kind: "formula",
        resultKind: "integer",
        width: 16,
        formula: (r) => `IFERROR(ROUND(${be}*${r.index}/${(SCENARIOS - 1) / 2},0),0)`,
      },
      {
        key: "sales",
        header: "Ventas",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        formula: (r) => `${r.c("units")}*${inputs.cell("price")}`,
      },
      {
        key: "costs",
        header: "Costos totales",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        formula: (r) => `${fixed.total("amount")}+${r.c("units")}*${inputs.cell("variable")}`,
      },
      {
        key: "profit",
        header: "Utilidad o pérdida",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        allowNegative: true,
        formula: (r) => `${r.c("sales")}-${r.c("costs")}`,
      },
    ],
    rows: SCENARIOS,
    theme,
    ctx,
  });
  const p = `${scen.letter("profit")}${scen.firstRow}`;
  highlightWhen(ws, `${p}:${scen.letter("profit")}${scen.lastRow}`, `${p}<0`, {
    fill: theme.dangerSoft,
    color: theme.danger,
  });
  highlightWhen(ws, `${p}:${scen.letter("profit")}${scen.lastRow}`, `${p}>=0`, {
    fill: theme.okSoft,
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Punto de equilibrio",
    description:
      "Descubre cuánto necesitas vender para no perder dinero y para alcanzar tu meta de utilidad.",
    steps: [
      "Escribe tus costos fijos mensuales (los que pagas aunque no vendas).",
      "Escribe el precio de venta y el costo variable de cada unidad (materiales, empaque, comisión).",
      "El punto de equilibrio en unidades y en dinero se calcula solo.",
      "La tabla de escenarios muestra la utilidad o pérdida con distintos volúmenes de venta.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
