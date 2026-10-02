import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import type { PresupuestoMensualConfig } from "./form";

export const build: TemplateBuild<PresupuestoMensualConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const period = periodLabel(config.month, config.year);
  const wb = createWorkbook({
    title: titleWith(`Presupuesto ${period}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Presupuesto", { tabColor: theme.primary });
  const exp = addSheet(wb, "Gastos", { freezeRows: 4, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "categories", title: "Categorías", values: config.categories },
    {
      key: "methods",
      title: "Forma de pago",
      values: ["Efectivo", "Tarjeta de débito", "Tarjeta de crédito", "Transferencia"],
    },
  ]);
  const ex = config.example;
  addSheetHeader(exp, {
    title: "Registro de gastos",
    subtitle: "Anota cada gasto con su categoría.",
    theme,
    width: 5,
  });
  const m = config.month;
  const y = config.year;
  const gastos = addTable(exp, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 26,
        list: { source: lists.source("categories") },
      },
      { key: "detail", header: "Descripción", kind: "text", width: 32 },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 18,
        list: { source: lists.source("methods") },
      },
    ],
    rows: 300,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, m, 2),
            category: config.categories[0],
            detail: "Supermercado",
            amount: 3200,
            method: "Tarjeta de débito",
          },
          {
            date: exampleDate(y, m, 5),
            category: config.categories[1] ?? config.categories[0],
            detail: "Alquiler",
            amount: 6500,
            method: "Transferencia",
          },
          {
            date: exampleDate(y, m, 10),
            category: config.categories[2] ?? config.categories[0],
            detail: "Factura ENEE",
            amount: 1350,
            method: "Efectivo",
          },
          {
            date: exampleDate(y, m, 18),
            category: config.categories[0],
            detail: "Mercado",
            amount: 1100,
            method: "Efectivo",
          },
        ]
      : undefined,
  });

  addSheetHeader(ws, {
    title: titleWith(`Presupuesto de ${period}`, config.businessName),
    subtitle: "Escribe tus ingresos y cuánto planeas gastar en cada categoría.",
    theme,
    width: 6,
  });
  const incomes = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "source", header: "Ingresos", kind: "text", width: 32 },
      { key: "amount", header: "Monto del mes", kind: "currency", width: 16, total: "sum" },
    ],
    rows: config.incomes.length + 2,
    theme,
    ctx,
    totals: { label: "Total ingresos" },
    example: config.incomes.map((source, i) => ({
      source,
      amount: ex ? ([18_000, 4_000, 2_500][i] ?? null) : null,
    })),
  });
  const budgetStart = (incomes.totalRow ?? incomes.lastRow) + 2;
  const start = `DATE(${y},${m},1)`;
  const budget = addTable(ws, {
    startRow: budgetStart,
    columns: [
      { key: "category", header: "Categoría de gasto", kind: "text", width: 32 },
      { key: "planned", header: "Presupuesto", kind: "currency", width: 16, total: "sum" },
      {
        key: "spent",
        header: "Gastado",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("category")}="","",SUMIFS(${gastos.sheetRange("amount")},${gastos.sheetRange("category")},${r.c("category")},${gastos.sheetRange("date")},">="&${start},${gastos.sheetRange("date")},"<="&EOMONTH(${start},0)))`,
      },
      {
        key: "left",
        header: "Disponible",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("category")}="","",${r.c("planned")}-${r.c("spent")})`,
      },
      {
        key: "used",
        header: "% usado",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("category")}="",${r.c("planned")}=0),"",${r.c("spent")}/${r.c("planned")})`,
      },
    ],
    rows: config.categories.length + 3,
    theme,
    ctx,
    totals: { label: "Total gastos" },
    example: config.categories.map((category, i) => ({
      category,
      planned: ex
        ? ([6_000, 6_500, 1_500, 400, 900, 2_000, 1_500, 800, 2_000, 600, 800, 2_000, 500][i] ??
          null)
        : null,
    })),
  });
  const used = `${budget.letter("used")}${budget.firstRow}`;
  const usedRange = `${used}:${budget.letter("used")}${budget.lastRow}`;
  highlightWhen(
    ws,
    usedRange,
    `AND(${used}<>"",${used}>1)`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
    1,
  );
  highlightWhen(ws, usedRange, `AND(${used}<>"",${used}>0.85)`, { fill: theme.warningSoft }, 2);
  addFields(ws, {
    startRow: 4,
    labelCol: 4,
    valueCol: 5,
    title: "Resumen del mes",
    fields: [
      {
        key: "in",
        label: "Ingresos",
        kind: "calc",
        resultKind: "currency",
        formula: () => incomes.total("amount"),
      },
      {
        key: "planned",
        label: "Gastos presupuestados",
        kind: "calc",
        resultKind: "currency",
        formula: () => budget.total("planned"),
      },
      {
        key: "spent",
        label: "Gastos reales",
        kind: "calc",
        resultKind: "currency",
        formula: () => budget.total("spent"),
      },
      {
        key: "saving",
        label: "Lo que queda (ahorro)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => `${r("in")}-${r("spent")}`,
      },
      {
        key: "rate",
        label: "Tasa de ahorro",
        kind: "calc",
        resultKind: "percent",
        formula: (r) => `IFERROR(${r("saving")}/${r("in")},0)`,
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Presupuesto mensual",
    description: "Planifica tus gastos del mes y compara contra lo que realmente gastas.",
    steps: [
      "En Presupuesto escribe tus ingresos del mes y cuánto planeas gastar en cada categoría.",
      "Durante el mes, anota cada gasto en la hoja Gastos con su fecha y categoría.",
      "La columna Gastado se actualiza sola; las categorías en ámbar están por llegar al límite y las rojas ya lo pasaron.",
      "Revisa el resumen: lo que queda es tu ahorro del mes.",
    ],
    tips: ["Una regla útil: 50 % necesidades, 30 % gustos y 20 % ahorro y deudas."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
