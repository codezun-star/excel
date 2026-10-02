import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS, addMemberMatrix } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { PensionesConfig } from "./form";

export const build: TemplateBuild<PensionesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const months = Array.from(
    { length: config.months },
    (_, i) => SHORT_MONTHS[(config.firstMonth - 1 + i) % 12]!,
  );
  const wb = createWorkbook({
    title: titleWith(`Mensualidades ${y}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Mensualidades", {
    freezeRows: 7,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  addSheetHeader(ws, {
    title: titleWith(`Control de mensualidades ${y}`, config.businessName),
    subtitle: "Escribe el monto pagado en el mes correspondiente.",
    theme,
    width: 20,
  });
  const ex = config.example;
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "cut",
        label: `Mensualidades vencidas al corte (1 a ${config.months})`,
        kind: "integer",
        value: ex ? 2 : 1,
      },
    ],
    theme,
    ctx,
  });
  const fee = config.fee;
  const table = addMemberMatrix(ws, {
    startRow: 7,
    rows: config.students,
    months,
    monthsDueCell: top.cell("cut"),
    leading: [
      { key: "student", header: "Alumno", kind: "text", width: 26 },
      { key: "grade", header: "Grado", kind: "text", width: 10 },
      { key: "guardian", header: "Encargado", kind: "text", width: 20 },
      { key: "phone", header: "Teléfono", kind: "text", width: 11 },
      {
        key: "enrollment",
        header: "Matrícula",
        kind: "currency",
        width: 11,
        fill: config.enrollment,
      },
      { key: "enrollmentPaid", header: "Matrícula pagada", kind: "currency", width: 11 },
      {
        key: "fee",
        header: "Mensualidad",
        kind: "currency",
        width: 11,
        fill: fee,
        note: "Ajusta si el alumno tiene beca o descuento.",
      },
    ],
    feeKey: "fee",
    oneTimeKey: "enrollment",
    oneTimePaidKey: "enrollmentPaid",
    theme,
    ctx,
    example: ex
      ? [
          {
            student: "Sofía Rodríguez",
            grade: "3.º",
            guardian: "Marta Rodríguez",
            enrollmentPaid: config.enrollment,
            m0: fee,
            m1: fee,
          },
          {
            student: "Diego Fúnez",
            grade: "5.º",
            guardian: "Óscar Fúnez",
            enrollmentPaid: config.enrollment,
            m0: fee,
          },
          {
            student: "Valeria Cruz",
            grade: "1.º",
            guardian: "Ana Cruz",
            enrollmentPaid: 1000,
            fee: fee / 2,
            m0: fee / 2,
            m1: fee / 2,
          },
        ]
      : undefined,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "collected",
        label: "Recaudado",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("paid"),
      },
      {
        key: "pending",
        label: "Por cobrar al corte",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("balance"),
      },
      {
        key: "late",
        label: "Alumnos con saldo",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${table.range("status")},"Moroso")`,
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);
  addInstructionsSheet(wb, {
    title: "Pensiones y mensualidades",
    description:
      "Lleva el cobro de matrícula y mensualidades de cada alumno durante el año escolar.",
    steps: [
      "Escribe cada alumno con su grado, encargado, matrícula y mensualidad (ajústala si tiene beca).",
      "Registra la matrícula pagada y el monto de cada mensualidad en su mes.",
      "Actualiza las mensualidades vencidas al corte: el saldo pendiente y los morosos se calculan solos.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
