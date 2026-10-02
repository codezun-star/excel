import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen, trafficLightScale } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import type { ComisionesConfig } from "./form";

const DEFAULT_TIERS: [number, number][] = [
  [0, 0.02],
  [50_000, 0.03],
  [100_000, 0.04],
  [200_000, 0.05],
  [400_000, 0.06],
];

export const build: TemplateBuild<ComisionesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const period = periodLabel(config.month, config.year);
  const title = titleWith(`Comisiones y bonos — ${period}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Comisiones", {
    freezeRows: 11,
    tabColor: theme.primary,
    landscape: true,
  });
  const tiersWs = addSheet(wb, "Tramos", { tabColor: theme.highlight });

  addSheetHeader(tiersWs, {
    title: "Tramos de comisión",
    subtitle:
      "La comisión se aplica a toda la venta según el tramo alcanzado. Mantén los montos de menor a mayor.",
    theme,
    width: 3,
  });
  const tiers = addTable(tiersWs, {
    startRow: 4,
    columns: [
      { key: "from", header: "Ventas desde", kind: "currency", width: 16 },
      { key: "rate", header: "% de comisión", kind: "percent", width: 14 },
    ],
    rows: DEFAULT_TIERS.length,
    theme,
    ctx,
    zebra: false,
    example: DEFAULT_TIERS.map(([from, rate]) => ({ from, rate })),
  });
  const bonus = addFields(tiersWs, {
    startRow: tiers.lastRow + 2,
    labelCol: 1,
    valueCol: 2,
    title: "Bonos",
    fields: [
      {
        key: "threshold",
        label: "Cumplimiento mínimo para el bono",
        kind: "percent",
        value: config.bonusThreshold / 100,
      },
      { key: "amount", label: "Monto del bono", kind: "currency", value: config.bonusAmount },
      {
        key: "extra",
        label: "Comisión extra sobre el excedente de la meta",
        kind: "percent",
        value: config.extraRate / 100,
      },
    ],
    theme,
    ctx,
  });
  tiersWs.getColumn(1).width = 44;
  const tierRange = `'Tramos'!$A$${tiers.firstRow}:$B$${tiers.lastRow}`;

  addSheetHeader(ws, {
    title,
    subtitle: "Escribe salario base, meta y ventas del mes de cada vendedor.",
    theme,
    width: 10,
  });
  const ex = config.example;
  const table = addTable(ws, {
    startRow: 11,
    columns: [
      { key: "name", header: "Vendedor", kind: "text", width: 26 },
      { key: "base", header: "Salario base", kind: "currency", width: 14, total: "sum" },
      { key: "goal", header: "Meta del mes", kind: "currency", width: 14, total: "sum" },
      { key: "sales", header: "Ventas del mes", kind: "currency", width: 14, total: "sum" },
      {
        key: "progress",
        header: "Cumplimiento",
        kind: "formula",
        resultKind: "percent",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("goal")})=0),"",N(${r.c("sales")})/${r.c("goal")})`,
      },
      {
        key: "rate",
        header: "% comisión",
        kind: "formula",
        resultKind: "percent",
        width: 11,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",${r.c("sales")}=""),"",VLOOKUP(${r.c("sales")},${tierRange},2,1))`,
      },
      {
        key: "commission",
        header: "Comisión",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("rate")}="","",ROUND(${r.c("sales")}*${r.c("rate")},2))`,
      },
      {
        key: "bonus",
        header: "Bono por meta",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("progress")}="","",IF(${r.c("progress")}>=${bonus.ref("threshold")},${bonus.ref("amount")},0))`,
      },
      {
        key: "extra",
        header: "Extra sobre excedente",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("progress")}="","",ROUND(MAX(0,${r.c("sales")}-${r.c("goal")})*${bonus.ref("extra")},2))`,
      },
      {
        key: "total",
        header: "Total a pagar",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",N(${r.c("base")})+N(${r.c("commission")})+N(${r.c("bonus")})+N(${r.c("extra")}))`,
      },
    ],
    rows: config.sellers,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          { name: "María Rodríguez", base: 12000, goal: 150000, sales: 182000 },
          { name: "José Hernández", base: 12000, goal: 150000, sales: 96000 },
          { name: "Karla Flores", base: 11000, goal: 120000, sales: 125000 },
        ]
      : undefined,
  });

  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "period", label: "Período", kind: "text", value: period },
      {
        key: "sales",
        label: "Ventas totales",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("sales"),
      },
      {
        key: "commissions",
        label: "Comisiones y bonos",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `${table.total("commission")}+${table.total("bonus")}+${table.total("extra")}`,
      },
      {
        key: "total",
        label: "Total a pagar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("total"),
      },
      {
        key: "reached",
        label: "Vendedores que alcanzaron el bono",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${table.range("bonus")},">0")`,
      },
    ],
    theme,
    ctx,
  });
  const pr = table.letter("progress");
  trafficLightScale(ws, `${pr}${table.firstRow}:${pr}${table.lastRow}`);
  highlightWhen(
    ws,
    `${table.letter("bonus")}${table.firstRow}:${table.letter("bonus")}${table.lastRow}`,
    `N(${table.letter("bonus")}${table.firstRow})>0`,
    { fill: theme.okSoft, bold: true },
    2,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Comisiones y bonos",
    description:
      "Calcula comisiones escalonadas y bonos por cumplimiento de meta para cada vendedor.",
    steps: [
      "En Tramos revisa los montos «Ventas desde» y el porcentaje de cada tramo (de menor a mayor).",
      "Ajusta el cumplimiento mínimo, el monto del bono y la comisión extra sobre el excedente.",
      "En Comisiones escribe salario base, meta y ventas del mes de cada vendedor.",
      "La comisión, los bonos y el total a pagar se calculan solos.",
    ],
    tips: [
      "La comisión aplica el porcentaje del tramo alcanzado a toda la venta del mes.",
      "Si no das bono, pon el monto del bono en 0.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
