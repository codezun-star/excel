import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { rangeAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ComisionesConfig } from "./form";

const SPARE = 10;

export const build: TemplateBuild<ComisionesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Comisiones de vendedores", config.businessName),
    ctx,
    options,
  });
  const commissions = addSheet(wb, "Comisiones", { tabColor: theme.primary });
  const salesWs = addSheet(wb, "Ventas", { freezeRows: 4, tabColor: theme.primary });
  const sellersWs = addSheet(wb, "Vendedores", { freezeRows: 4, tabColor: theme.primary });

  addSheetHeader(sellersWs, {
    title: "Vendedores, metas y comisiones",
    subtitle: "Ajusta la meta y los porcentajes de cada vendedor.",
    theme,
    width: 4,
  });
  const sellerCount = config.sellers.length + SPARE;
  const sellers = addTable(sellersWs, {
    startRow: 4,
    columns: [
      { key: "name", header: "Vendedor", kind: "text", width: 26 },
      { key: "goal", header: "Meta mensual", kind: "currency", width: 16 },
      { key: "base", header: "% comisión base", kind: "percent", width: 14 },
      { key: "bonus", header: "% al cumplir meta", kind: "percent", width: 16 },
    ],
    rows: sellerCount,
    theme,
    ctx,
    example: config.sellers.map((name) => ({
      name,
      goal: config.monthlyGoal,
      base: config.baseRate / 100,
      bonus: config.bonusRate / 100,
    })),
  });

  addSheetHeader(salesWs, {
    title: "Registro de ventas",
    subtitle: "Una venta por fila con su vendedor.",
    theme,
    width: 5,
  });
  const y = config.year;
  const m = config.month;
  const s = (i: number) => config.sellers[i % config.sellers.length]!;
  const sales = addTable(salesWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "seller",
        header: "Vendedor",
        kind: "list",
        width: 24,
        list: {
          source: sheetRef(
            sellersWs.name,
            rangeAddr(1, sellers.firstRow, 1, sellers.lastRow, true),
          ),
        },
      },
      { key: "client", header: "Cliente", kind: "text", width: 26 },
      { key: "invoice", header: "N.º factura", kind: "text", width: 20 },
      { key: "amount", header: "Monto", kind: "currency", width: 15, total: "sum" },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: config.example
      ? [
          {
            date: exampleDate(y, m, 2),
            seller: s(0),
            client: "Hotel Real",
            invoice: "F-2001",
            amount: 42000,
          },
          {
            date: exampleDate(y, m, 8),
            seller: s(0),
            client: "Comercial Díaz",
            invoice: "F-2002",
            amount: 25000,
          },
          {
            date: exampleDate(y, m, 10),
            seller: s(1),
            client: "Farmacia Vida",
            invoice: "F-2003",
            amount: 18000,
          },
          {
            date: exampleDate(y, m, 21),
            seller: s(2),
            client: "Ferretería Norte",
            invoice: "F-2004",
            amount: 30500,
          },
        ]
      : undefined,
  });

  addSheetHeader(commissions, {
    title: titleWith("Comisiones del mes", config.businessName),
    subtitle: "Cambia el mes y el año para calcular otro período.",
    theme,
    width: 6,
  });
  const period = addFields(commissions, {
    startRow: 4,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "month", label: "Mes (1 a 12)", kind: "integer", value: config.month },
      { key: "year", label: "Año", kind: "integer", value: config.year },
    ],
    theme,
    ctx,
  });
  const start = `DATE(${period.cell("year")},${period.cell("month")},1)`;
  const end = `EOMONTH(${start},0)`;
  const sheetCol = (key: string, index: number) =>
    sheetRef(sellersWs.name, sellers.cell(key, sellers.firstRow + index, true));
  const table = addTable(commissions, {
    startRow: 8,
    columns: [
      {
        key: "name",
        header: "Vendedor",
        kind: "formula",
        width: 26,
        formula: (r) => `IF(${sheetCol("name", r.index)}="","",${sheetCol("name", r.index)})`,
      },
      {
        key: "goal",
        header: "Meta",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${sheetCol("goal", r.index)})`,
      },
      {
        key: "sales",
        header: "Ventas del mes",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${sales.sheetRange("amount")},${sales.sheetRange("seller")},${r.c("name")},${sales.sheetRange("date")},">="&${start},${sales.sheetRange("date")},"<="&${end}))`,
      },
      {
        key: "pct",
        header: "% cumplimiento",
        kind: "formula",
        resultKind: "percent",
        width: 14,
        formula: (r) => `IF(${r.c("name")}="","",IFERROR(${r.c("sales")}/${r.c("goal")},0))`,
      },
      {
        key: "rate",
        header: "Tasa aplicada",
        kind: "formula",
        resultKind: "percent",
        width: 13,
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(${r.c("sales")}>=${r.c("goal")},${sheetCol("bonus", r.index)},${sheetCol("base", r.index)}))`,
      },
      {
        key: "commission",
        header: "Comisión",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",ROUND(${r.c("sales")}*${r.c("rate")},2))`,
      },
    ],
    rows: sellerCount,
    theme,
    ctx,
    totals: { label: "Totales" },
  });
  const pctRange = `D${table.firstRow}:D${table.lastRow}`;
  highlightWhen(commissions, pctRange, `AND(D${table.firstRow}<>"",D${table.firstRow}>=1)`, {
    fill: theme.okSoft,
    bold: true,
  });
  highlightWhen(commissions, pctRange, `AND(D${table.firstRow}<>"",D${table.firstRow}<0.5)`, {
    fill: theme.dangerSoft,
  });
  await protectSheet(commissions);

  addInstructionsSheet(wb, {
    title: "Ventas por vendedor y comisiones",
    description:
      "Calcula cuánto vendió cada vendedor en el mes, si cumplió su meta y cuánto le corresponde de comisión.",
    steps: [
      "En la hoja Vendedores escribe el nombre, la meta mensual y los porcentajes de comisión de cada vendedor.",
      "En la hoja Ventas registra cada venta con su fecha, vendedor y monto.",
      "En la hoja Comisiones elige el mes y el año: verás ventas, % de cumplimiento, tasa aplicada y comisión.",
      "Si un vendedor alcanza su meta se aplica automáticamente el porcentaje mayor.",
    ],
    sheets: [
      { name: "Comisiones", description: "Resultado del mes por vendedor." },
      { name: "Ventas", description: "Registro de ventas." },
      { name: "Vendedores", description: "Metas y porcentajes." },
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
