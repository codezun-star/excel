import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { offsetCell } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange, ifLabel } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { GastosConfig } from "./form";

export const build: TemplateBuild<GastosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const wb = createWorkbook({
    title: titleWith(`Gastos e ingresos ${y}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Registro", { freezeRows: 4, tabColor: theme.primary });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "income", title: "Categorías de ingreso", values: config.incomeCategories },
    { key: "expense", title: "Categorías de gasto", values: config.expenseCategories },
    {
      key: "all",
      title: "Todas las categorías",
      values: [...config.incomeCategories, ...config.expenseCategories],
      spare: 10,
    },
  ]);
  addSheetHeader(ws, {
    title: titleWith(`Gastos e ingresos ${y}`, config.businessName),
    subtitle: "Registra cada movimiento como Ingreso o Gasto.",
    theme,
    width: 6,
  });
  const ex = config.example;
  const table = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 10,
        list: ["Ingreso", "Gasto"],
        align: "center",
      },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 22,
        list: { source: lists.source("all") },
      },
      { key: "detail", header: "Descripción", kind: "text", width: 32 },
      { key: "amount", header: "Monto", kind: "currency", width: 14 },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 16,
        list: ["Efectivo", "Tarjeta", "Transferencia", "Otro"],
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 1),
            type: "Ingreso",
            category: config.incomeCategories[0],
            detail: "Salario de enero",
            amount: 20_000,
            method: "Transferencia",
          },
          {
            date: exampleDate(y, 1, 3),
            type: "Gasto",
            category: config.expenseCategories[0],
            detail: "Supermercado",
            amount: 3_400,
            method: "Tarjeta",
          },
          {
            date: exampleDate(y, 1, 15),
            type: "Gasto",
            category: config.expenseCategories[1] ?? config.expenseCategories[0],
            detail: "Alquiler",
            amount: 6_000,
            method: "Transferencia",
          },
          {
            date: exampleDate(y, 2, 1),
            type: "Ingreso",
            category: config.incomeCategories[0],
            detail: "Salario de febrero",
            amount: 20_000,
            method: "Transferencia",
          },
          {
            date: exampleDate(y, 2, 9),
            type: "Gasto",
            category: config.expenseCategories[0],
            detail: "Mercado",
            amount: 2_800,
            method: "Efectivo",
          },
        ]
      : undefined,
  });

  addSheetHeader(summary, {
    title: `Resumen ${y}`,
    subtitle: "Calculado a partir de la hoja Registro.",
    theme,
    width: 5,
  });
  const fields = addFields(summary, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const Y = fields.cell("year");
  const R = (k: string) => table.sheetRange(k);
  const inMonth = (s?: string, e?: string) => `${R("date")},">="&${s},${R("date")},"<="&${e}`;
  const inYear = `${R("date")},">="&DATE(${Y},1,1),${R("date")},"<="&DATE(${Y},12,31)`;
  const monthly = addMonthlySummary(summary, {
    startRow: 6,
    startCol: 1,
    yearCell: Y,
    theme,
    ctx,
    values: [
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"Ingreso",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Gastos",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"Gasto",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Balance",
        kind: "currency",
        formula: (k) => `${offsetCell(k.labelCell, 1)}-${offsetCell(k.labelCell, 2)}`,
      },
    ],
  });
  addCategorySummary(summary, {
    startRow: monthly.totalRow + 2,
    startCol: 1,
    labelHeader: "Gasto por categoría",
    sourceCells: cellsOfRange(lists.source("expense")),
    values: [
      {
        header: "Monto del año",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIFS(${R("amount")},${R("type")},"Gasto",${R("category")},${k.labelCell},${inYear})`,
          ),
      },
      {
        header: "% del gasto",
        kind: "percent",
        formula: (k) =>
          ifLabel(k, `IFERROR(${offsetCell(k.labelCell, 1)}/${monthly.totalCell(1)},0)`),
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(summary);
  addInstructionsSheet(wb, {
    title: "Gastos e ingresos",
    description: "Anota tus movimientos de dinero y descubre en qué se va tu plata.",
    steps: [
      "En Registro anota cada ingreso o gasto: fecha, tipo, categoría, descripción y monto.",
      "La hoja Resumen muestra ingresos, gastos y balance de cada mes del año.",
      "Más abajo verás cuánto gastaste en cada categoría y qué porcentaje representa.",
      "Edita las categorías en la hoja Listas.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
