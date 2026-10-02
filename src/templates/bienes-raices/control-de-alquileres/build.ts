import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS, addMemberMatrix } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { AlquileresConfig } from "./form";

export const build: TemplateBuild<AlquileresConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const wb = createWorkbook({
    title: titleWith(`Alquileres ${y}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Alquileres", {
    freezeRows: 7,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  addSheetHeader(ws, {
    title: titleWith(`Control de alquileres ${y}`, config.businessName),
    subtitle: "Escribe el monto cobrado en el mes correspondiente.",
    theme,
    width: 22,
  });
  const ex = config.example;
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "cut",
        label: "Meses vencidos al corte (1 a 12)",
        kind: "integer",
        value: ex ? 3 : new Date().getMonth() + 1,
      },
    ],
    theme,
    ctx,
  });
  const table = addMemberMatrix(ws, {
    startRow: 7,
    rows: config.units,
    months: SHORT_MONTHS,
    monthsDueCell: top.cell("cut"),
    leading: [
      { key: "unit", header: "Unidad", kind: "text", width: 14 },
      { key: "tenant", header: "Inquilino", kind: "text", width: 22 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      { key: "rent", header: "Renta mensual", kind: "currency", width: 12 },
      { key: "deposit", header: "Depósito", kind: "currency", width: 11 },
      { key: "end", header: "Fin del contrato", kind: "date", width: 12 },
    ],
    feeKey: "rent",
    theme,
    ctx,
    example: ex
      ? [
          {
            unit: "Apto 1",
            tenant: "Luis Ortega",
            phone: "9988-7766",
            rent: 6500,
            deposit: 6500,
            end: `${y}-12-31`,
            m0: 6500,
            m1: 6500,
            m2: 6500,
          },
          {
            unit: "Apto 2",
            tenant: "Karla Medina",
            phone: "3322-1100",
            rent: 5500,
            deposit: 5500,
            end: `${y}-04-15`,
            m0: 5500,
            m1: 5500,
          },
          {
            unit: "Local A",
            tenant: "Pulpería Don Beto",
            phone: "9456-1234",
            rent: 8000,
            deposit: 16000,
            end: `${y + 1}-06-30`,
            m0: 8000,
            m1: 8000,
            m2: 8000,
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
        label: "Cobrado en el año",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("paid"),
      },
      {
        key: "pending",
        label: "Por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("balance"),
      },
      {
        key: "deposits",
        label: "Depósitos en garantía",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUM(${table.range("deposit")})`,
      },
    ],
    theme,
    ctx,
  });
  const end = `${table.letter("end")}${table.firstRow}`;
  highlightWhen(
    ws,
    `${end}:${table.letter("end")}${table.lastRow}`,
    `AND(${end}<>"",${end}-TODAY()<=30)`,
    { fill: theme.warningSoft, bold: true },
    1,
  );
  await protectSheet(ws);
  addInstructionsSheet(wb, {
    title: "Control de alquileres",
    description: "Sabe quién te ha pagado, quién está atrasado y qué contratos están por vencer.",
    steps: [
      "Escribe cada unidad con su inquilino, renta mensual, depósito y fecha de fin del contrato.",
      "Cuando cobres, escribe el monto en la columna del mes.",
      "Actualiza los meses vencidos al corte: el saldo pendiente y los morosos se calculan solos.",
      "Los contratos que vencen en 30 días o menos se marcan en ámbar.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
