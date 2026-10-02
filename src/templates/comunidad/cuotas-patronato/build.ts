import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS, addMemberMatrix } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { PatronatoConfig } from "./form";

export const build: TemplateBuild<PatronatoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const wb = createWorkbook({ title: titleWith(`Cuotas ${y}`, config.businessName), ctx, options });
  const ws = addSheet(wb, "Cuotas", {
    freezeRows: 6,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const exp = addSheet(wb, "Gastos", { freezeRows: 4, tabColor: theme.primary });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });
  addSheetHeader(ws, {
    title: titleWith(`Control de cuotas ${y}`, config.businessName),
    subtitle: "Escribe el monto pagado en el mes correspondiente.",
    theme,
    width: 18,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "cut",
        label: "Meses vencidos al corte (1 a 12)",
        kind: "integer",
        value: config.example ? 3 : new Date().getMonth() + 1,
      },
    ],
    theme,
    ctx,
  });
  const ex = config.example;
  const fee = config.fee;
  const matrix = addMemberMatrix(ws, {
    startRow: 6,
    rows: config.members,
    months: SHORT_MONTHS,
    monthsDueCell: top.cell("cut"),
    leading: [
      { key: "name", header: "Vivienda / familia", kind: "text", width: 26 },
      { key: "fee", header: "Cuota", kind: "currency", width: 10, fill: fee },
    ],
    feeKey: "fee",
    theme,
    ctx,
    example: ex
      ? [
          { name: "Casa 1 — Familia Reyes", m0: fee, m1: fee, m2: fee },
          { name: "Casa 2 — Familia López", m0: fee },
          { name: "Casa 3 — Familia Mejía", m0: fee, m1: fee, m2: fee, m3: fee },
        ]
      : undefined,
  });
  addSheetHeader(exp, {
    title: "Gastos del patronato",
    subtitle: "Registra cada gasto con su comprobante.",
    theme,
    width: 5,
  });
  const gastos = addTable(exp, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "concept", header: "Concepto", kind: "text", width: 34 },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
      { key: "by", header: "Responsable", kind: "text", width: 20 },
      { key: "receipt", header: "Comprobante", kind: "text", width: 16 },
    ],
    rows: 300,
    theme,
    ctx,
    totals: { label: "Total gastos" },
    example: ex
      ? [
          {
            date: exampleDate(y, 2, 10),
            concept: "Reparación de alumbrado público",
            amount: 450,
            by: "Tesorería",
          },
        ]
      : undefined,
  });
  addSheetHeader(summary, {
    title: `Resumen ${y}`,
    subtitle: "Informe para la asamblea.",
    theme,
    width: 2,
  });
  summary.getColumn(1).width = 40;
  addFields(summary, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "opening",
        label: "Saldo inicial en caja",
        kind: "currency",
        value: config.openingBalance,
      },
      {
        key: "collected",
        label: "Total recaudado en cuotas",
        kind: "calc",
        resultKind: "currency",
        formula: () => matrix.sheetTotal("paid"),
      },
      {
        key: "spent",
        label: "Total de gastos",
        kind: "calc",
        resultKind: "currency",
        formula: () => gastos.sheetTotal("amount"),
      },
      {
        key: "cash",
        label: "Saldo en caja",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => `${r("opening")}+${r("collected")}-${r("spent")}`,
      },
      {
        key: "pending",
        label: "Cuotas pendientes de cobro",
        kind: "calc",
        resultKind: "currency",
        formula: () => matrix.sheetTotal("balance"),
      },
      {
        key: "late",
        label: "Viviendas morosas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${matrix.sheetRange("status")},"Moroso")`,
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);
  await protectSheet(summary);
  addInstructionsSheet(wb, {
    title: "Cuotas de patronato",
    description:
      "Administra las cuotas de la comunidad con transparencia y presenta cuentas claras en la asamblea.",
    steps: [
      "En Cuotas escribe cada vivienda o familia y su cuota mensual.",
      "Cada vez que alguien pague, escribe el monto en la columna del mes.",
      "Actualiza los meses vencidos al corte: el saldo pendiente y los morosos se calculan solos.",
      "Registra los gastos en la hoja Gastos; el Resumen muestra el saldo en caja.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
