import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addMonthGrid, monthHeadersFrom } from "@/lib/excel/grid";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addr, colLetter } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { FlujoConfig } from "./form";

export const build: TemplateBuild<FlujoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Flujo de caja", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Flujo de caja", {
    freezeRows: 6,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  addSheetHeader(ws, {
    title: titleWith("Flujo de caja proyectado", config.businessName),
    subtitle:
      "Escribe los montos esperados (o reales) de cada mes. Los totales y saldos se calculan solos.",
    theme,
    width: 14,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 2,
    fields: [
      {
        key: "opening",
        label: "Saldo inicial de efectivo",
        kind: "currency",
        value: config.openingBalance,
      },
    ],
    theme,
    ctx,
  });
  const ex = config.example;
  const grid = addMonthGrid(ws, {
    startRow: 6,
    labelHeader: "Concepto",
    monthHeaders: monthHeadersFrom(config.month, config.year),
    sections: [
      {
        key: "in",
        title: "Entradas de efectivo",
        rows: config.incomeCategories,
        subtotalLabel: "Total entradas",
        spare: 2,
      },
      {
        key: "out",
        title: "Salidas de efectivo",
        rows: config.expenseCategories,
        subtotalLabel: "Total salidas",
        spare: 3,
      },
    ],
    theme,
    ctx,
    example: ex
      ? {
          in: [Array(12).fill(60000), Array(12).fill(15000)],
          out: [
            Array(12).fill(38000),
            Array(12).fill(18000),
            Array(12).fill(6000),
            Array(12).fill(2500),
          ],
        }
      : undefined,
  });
  const inRow = grid.subtotalRow("in");
  const outRow = grid.subtotalRow("out");
  const netRow = grid.addRow(
    "Flujo neto del mes",
    (_m, col) => `${addr(col, inRow)}-${addr(col, outRow)}`,
    { emphasis: true },
  );
  const openRow = grid.nextRow;
  const finalRow = openRow + 1;
  grid.addRow(
    "Saldo inicial",
    (m, col) => (m === 0 ? top.cell("opening") : addr(col - 1, finalRow)),
    { total: "none" },
  );
  grid.addRow("Saldo final", (_m, col) => `${addr(col, openRow)}+${addr(col, netRow)}`, {
    emphasis: true,
    total: "last",
  });
  const rangeFinal = `${colLetter(grid.firstCol)}${finalRow}:${colLetter(grid.totalCol)}${finalRow}`;
  highlightWhen(ws, rangeFinal, `${colLetter(grid.firstCol)}${finalRow}<0`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  highlightWhen(
    ws,
    `${colLetter(grid.firstCol)}${netRow}:${colLetter(grid.totalCol)}${netRow}`,
    `${colLetter(grid.firstCol)}${netRow}<0`,
    { color: theme.danger },
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Flujo de caja",
    description:
      "Proyecta tus entradas y salidas de efectivo para anticipar meses con faltante de dinero.",
    steps: [
      "Escribe el saldo inicial de efectivo (caja y bancos).",
      "Escribe para cada mes los ingresos y egresos esperados por categoría. Puedes renombrar categorías o usar las filas libres.",
      "El flujo neto, el saldo inicial y el saldo final de cada mes se calculan solos.",
      "Si el saldo final de un mes queda negativo, se marca en rojo: necesitarás financiamiento o ajustar gastos.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
