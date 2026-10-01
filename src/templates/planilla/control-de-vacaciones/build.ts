import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { rangeAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import { EXAMPLE_EMPLOYEES } from "../shared/form";
import type { VacacionesConfig } from "./form";

const MAX_YEARS = 45;

/** Días acumulados por años cumplidos según la escala del país. */
function cumulativeVacation(
  scale: { fromYears: number; days: number }[],
): [number, number, number][] {
  const sorted = [...scale].sort((a, b) => a.fromYears - b.fromYears);
  const daysFor = (year: number) =>
    [...sorted].reverse().find((s) => year >= s.fromYears)?.days ?? 0;
  const rows: [number, number, number][] = [[0, 0, daysFor(1)]];
  let acc = 0;
  for (let y = 1; y <= MAX_YEARS; y++) {
    acc += daysFor(y);
    rows.push([y, acc, daysFor(y + 1)]);
  }
  return rows;
}

export const build: TemplateBuild<VacacionesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Control de vacaciones", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Saldos", { freezeRows: 6, landscape: true, tabColor: theme.primary });
  const log = addSheet(wb, "Vacaciones tomadas", { freezeRows: 4, tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Bases",
        rows: [
          {
            key: "days:year",
            label: "Días por año (base comercial)",
            value: ctx.labor.dayBasis,
            kind: "integer",
          },
        ],
      },
    ],
    tables: [
      {
        key: "vac",
        title: "Escala de vacaciones acumuladas (días hábiles)",
        columns: [
          { header: "Años cumplidos", kind: "integer" },
          { header: "Días ganados acumulados", kind: "integer" },
          { header: "Días del siguiente período", kind: "integer" },
        ],
        rows: cumulativeVacation(ctx.labor.vacationDays),
        note: "Calculada a partir de la escala legal de vacaciones del país.",
      },
    ],
  });

  addSheetHeader(ws, {
    title: titleWith("Control de vacaciones", config.businessName),
    subtitle:
      "Los días ganados se calculan según los años de servicio cumplidos a la fecha de corte.",
    theme,
    width: 9,
  });
  const cut = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "cut",
        label: "Fecha de corte",
        kind: "calc",
        resultKind: "date",
        formula: () => "TODAY()",
      },
    ],
    theme,
    ctx,
  });
  const cutCell = cut.cell("cut");

  // Registro primero para referenciar sus rangos
  addSheetHeader(log, {
    title: "Vacaciones tomadas",
    subtitle: "Registra cada período de vacaciones gozado.",
    theme,
    width: 5,
  });
  const vac = params.table("vac");
  const employees = addTable(ws, {
    startRow: 6,
    columns: [
      { key: "name", header: "Empleado", kind: "text", width: 26 },
      { key: "position", header: "Cargo", kind: "text", width: 18 },
      { key: "start", header: "Fecha de ingreso", kind: "date", width: 13 },
      {
        key: "years",
        header: "Años cumplidos",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(${r.c("start")}="","",MAX(0,INT((DAYS360(${r.c("start")},${cutCell},1)+1)/${params.ref("days:year")})))`,
      },
      {
        key: "earned",
        header: "Días ganados",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) => `IF(${r.c("years")}="","",IFERROR(VLOOKUP(${r.c("years")},${vac},2,1),0))`,
      },
      {
        key: "taken",
        header: "Días tomados",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: () => "0",
      },
      {
        key: "pending",
        header: "Días pendientes",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) => `IF(${r.c("earned")}="","",${r.c("earned")}-${r.c("taken")})`,
      },
      {
        key: "next",
        header: "Próximo aniversario",
        kind: "formula",
        resultKind: "date",
        width: 13,
        formula: (r) => `IF(${r.c("years")}="","",EDATE(${r.c("start")},12*(${r.c("years")}+1)))`,
      },
      {
        key: "nextDays",
        header: "Días que ganará",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) => `IF(${r.c("years")}="","",IFERROR(VLOOKUP(${r.c("years")},${vac},3,1),0))`,
      },
    ],
    rows: config.employees,
    theme,
    ctx,
    headerHeight: 36,
    example: config.example
      ? [
          {
            name: EXAMPLE_EMPLOYEES[0]!.name,
            position: EXAMPLE_EMPLOYEES[0]!.position,
            start: "2019-02-01",
          },
          {
            name: EXAMPLE_EMPLOYEES[1]!.name,
            position: EXAMPLE_EMPLOYEES[1]!.position,
            start: "2023-08-16",
          },
          {
            name: EXAMPLE_EMPLOYEES[2]!.name,
            position: EXAMPLE_EMPLOYEES[2]!.position,
            start: "2025-01-10",
          },
        ]
      : undefined,
  });

  const names = sheetRef(ws.name, rangeAddr(1, employees.firstRow, 1, employees.lastRow, true));
  const logTable = addTable(log, {
    startRow: 4,
    columns: [
      { key: "employee", header: "Empleado", kind: "list", width: 26, list: { source: names } },
      { key: "from", header: "Desde", kind: "date", width: 12 },
      { key: "to", header: "Hasta", kind: "date", width: 12 },
      { key: "days", header: "Días hábiles tomados", kind: "number", width: 12, total: "sum" },
      { key: "note", header: "Observaciones", kind: "text", width: 30 },
    ],
    rows: config.logRows,
    theme,
    ctx,
    totals: { label: "Total" },
    example: config.example
      ? [
          { employee: EXAMPLE_EMPLOYEES[0]!.name, from: "2025-12-15", to: "2025-12-26", days: 10 },
          { employee: EXAMPLE_EMPLOYEES[1]!.name, from: "2025-04-14", to: "2025-04-18", days: 5 },
        ]
      : undefined,
  });
  // Días tomados = suma del registro
  for (let r = employees.firstRow; r <= employees.lastRow; r++) {
    const name = employees.cell("name", r);
    ws.getCell(employees.cell("taken", r)).value = {
      formula: `IF(${name}="","",SUMIF(${logTable.sheetRange("employee")},${name},${logTable.sheetRange("days")}))`,
    };
  }
  const pend = `${employees.letter("pending")}${employees.firstRow}`;
  highlightWhen(
    ws,
    `${pend}:${employees.letter("pending")}${employees.lastRow}`,
    `AND(${pend}<>"",${pend}<0)`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
  );
  highlightWhen(
    ws,
    `${pend}:${employees.letter("pending")}${employees.lastRow}`,
    `AND(${pend}<>"",${pend}>=20)`,
    { fill: theme.warningSoft },
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Control de vacaciones",
    description:
      "Lleva el saldo de vacaciones de cada empleado según su antigüedad y lo que ya ha tomado.",
    steps: [
      "En Saldos escribe cada empleado con su fecha de ingreso. La fecha de corte es hoy.",
      "Los años cumplidos y los días ganados acumulados se calculan con la escala de la hoja Parámetros.",
      "Registra cada período de vacaciones en la hoja Vacaciones tomadas, con los días hábiles gozados.",
      "El saldo pendiente se actualiza solo. Un saldo negativo se marca en rojo y uno alto en ámbar.",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
