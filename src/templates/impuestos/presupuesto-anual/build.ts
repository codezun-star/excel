import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addMonthGrid, monthHeadersFrom } from "@/lib/excel/grid";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addr, colLetter, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { PresupuestoAnualConfig } from "./form";

export const build: TemplateBuild<PresupuestoAnualConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const wb = createWorkbook({
    title: titleWith(`Presupuesto ${y}`, config.businessName),
    ctx,
    options,
  });
  const budget = addSheet(wb, "Presupuesto", {
    freezeRows: 5,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const actualWs = addSheet(wb, "Real", { freezeRows: 4, tabColor: theme.primary });
  const compare = addSheet(wb, "Comparación", {
    freezeRows: 5,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const lists = addListsSheet(wb, theme, [
    {
      key: "categories",
      title: "Categorías",
      values: [...config.incomeCategories, ...config.expenseCategories],
    },
  ]);
  const headers = monthHeadersFrom(1, y);

  addSheetHeader(budget, {
    title: titleWith(`Presupuesto ${y}`, config.businessName),
    subtitle: "Escribe el monto presupuestado de cada categoría por mes.",
    theme,
    width: 14,
  });
  const ex = config.example;
  const grid = addMonthGrid(budget, {
    startRow: 5,
    labelHeader: "Categoría",
    monthHeaders: headers,
    sections: [
      {
        key: "in",
        title: "Ingresos",
        rows: config.incomeCategories,
        subtotalLabel: "Total ingresos",
      },
      {
        key: "out",
        title: "Gastos",
        rows: config.expenseCategories,
        subtotalLabel: "Total gastos",
      },
    ],
    theme,
    ctx,
    example: ex
      ? { in: [Array(12).fill(100_000)], out: [Array(12).fill(55_000), Array(12).fill(20_000)] }
      : undefined,
  });
  grid.addRow(
    "Resultado presupuestado",
    (_m, col) => `${addr(col, grid.subtotalRow("in"))}-${addr(col, grid.subtotalRow("out"))}`,
    { emphasis: true },
  );

  addSheetHeader(actualWs, {
    title: "Movimientos reales",
    subtitle: "Registra cada ingreso o gasto real con su categoría.",
    theme,
    width: 4,
  });
  const actual = addTable(actualWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 24,
        list: { source: lists.source("categories") },
      },
      { key: "detail", header: "Detalle", kind: "text", width: 34 },
      { key: "amount", header: "Monto", kind: "currency", width: 15, total: "sum" },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 15),
            category: config.incomeCategories[0],
            detail: "Ventas de enero",
            amount: 112_000,
          },
          {
            date: exampleDate(y, 1, 20),
            category: config.expenseCategories[0],
            detail: "Compras de enero",
            amount: 61_000,
          },
          {
            date: exampleDate(y, 1, 31),
            category: config.expenseCategories[1] ?? config.expenseCategories[0],
            detail: "Planilla de enero",
            amount: 20_000,
          },
        ]
      : undefined,
  });

  addSheetHeader(compare, {
    title: "Presupuesto contra real",
    subtitle: "Real del mes (de la hoja Real) y porcentaje de ejecución sobre lo presupuestado.",
    theme,
    width: 14,
  });
  const yearCell = addFields(compare, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "calc", resultKind: "integer", formula: () => String(y) },
    ],
    theme,
    ctx,
  }).cell("year");
  const realGrid = addMonthGrid(compare, {
    startRow: 5,
    labelHeader: "Categoría (real)",
    monthHeaders: headers,
    sections: [
      {
        key: "in",
        title: "Ingresos reales",
        rows: config.incomeCategories,
        subtotalLabel: "Total ingresos reales",
      },
      {
        key: "out",
        title: "Gastos reales",
        rows: config.expenseCategories,
        subtotalLabel: "Total gastos reales",
      },
    ],
    theme,
    ctx,
  });
  // Las celdas de la comparación son fórmulas (no captura)
  for (const section of ["in", "out"]) {
    const { first, last } = realGrid.sectionRows(section);
    for (let r = first; r <= last; r++) {
      const label = compare.getCell(r, 1);
      const budgetRow = grid.sectionRows(section).first + (r - first);
      label.value = {
        formula: `${sheetRef(budget.name, addr(1, budgetRow, { absCol: true, absRow: true }))}&""`,
      };
      label.protection = { locked: true };
      for (let m = 0; m < 12; m++) {
        const col = realGrid.monthCol(m);
        const c = compare.getCell(r, col);
        const start = `DATE(${yearCell},${m + 1},1)`;
        c.value = {
          formula: `IF(${addr(1, r)}="",0,SUMIFS(${actual.sheetRange("amount")},${actual.sheetRange("category")},${addr(1, r)},${actual.sheetRange("date")},">="&${start},${actual.sheetRange("date")},"<="&EOMONTH(${start},0)))`,
        };
        c.protection = { locked: true };
      }
    }
  }
  const realIn = realGrid.subtotalRow("in");
  const realOut = realGrid.subtotalRow("out");
  const resRow = realGrid.addRow(
    "Resultado real",
    (_m, col) => `${addr(col, realIn)}-${addr(col, realOut)}`,
    { emphasis: true },
  );
  const budgetRef = (row: number, col: number) => sheetRef(budget.name, addr(col, row));
  realGrid.addRow(
    "% ejecución de ingresos",
    (_m, col) => `IFERROR(${addr(col, realIn)}/${budgetRef(grid.subtotalRow("in"), col)},0)`,
    { kind: "percent", total: "none" },
  );
  const execOut = realGrid.addRow(
    "% ejecución de gastos",
    (_m, col) => `IFERROR(${addr(col, realOut)}/${budgetRef(grid.subtotalRow("out"), col)},0)`,
    { kind: "percent", total: "none" },
  );
  const first = colLetter(realGrid.firstCol);
  highlightWhen(
    compare,
    `${first}${execOut}:${colLetter(realGrid.lastCol)}${execOut}`,
    `${first}${execOut}>1`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
  );
  highlightWhen(
    compare,
    `${first}${resRow}:${colLetter(realGrid.totalCol)}${resRow}`,
    `${first}${resRow}<0`,
    { color: theme.danger, bold: true },
  );
  await protectSheet(compare);

  addInstructionsSheet(wb, {
    title: "Presupuesto anual",
    description:
      "Planifica tus ingresos y gastos del año y compáralos contra lo que realmente ocurre.",
    steps: [
      "En la hoja Presupuesto escribe el monto esperado de cada categoría para cada mes.",
      "En la hoja Real registra cada ingreso y gasto con su fecha y categoría.",
      "La hoja Comparación suma lo real por categoría y mes y muestra el porcentaje de ejecución.",
      "Si los gastos superan lo presupuestado en un mes, el porcentaje se marca en rojo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
