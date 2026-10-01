import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, cellsOfRange, ifLabel } from "@/lib/excel/summary";
import { addTable, blankUnlessAll } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import type { HorasExtraConfig } from "./form";

const JORNADAS = ["Diurna", "Nocturna", "Mixta"] as const;

export const build: TemplateBuild<HorasExtraConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const period = periodLabel(config.month, config.year);
  const wb = createWorkbook({
    title: titleWith(`Horas extra ${period}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Horas extra", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const w = ctx.labor.workdays;
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Bases",
        rows: [
          {
            key: "days:month",
            label: "Días por mes (base comercial)",
            value: ctx.labor.dayBasis / 12,
            kind: "integer",
          },
        ],
      },
    ],
    tables: [
      {
        key: "jornadas",
        title: "Jornadas ordinarias",
        columns: [
          { header: "Jornada", kind: "text" },
          { header: "Horas por día", kind: "number" },
          { header: "Horas por semana", kind: "number" },
        ],
        rows: [
          [JORNADAS[0], w.day.hoursPerDay, w.day.hoursPerWeek],
          [JORNADAS[1], w.night.hoursPerDay, w.night.hoursPerWeek],
          [JORNADAS[2], w.mixed.hoursPerDay, w.mixed.hoursPerWeek],
        ],
      },
      {
        key: "overtime",
        title: "Recargos por hora extra",
        columns: [
          { header: "Tipo de hora extra", kind: "text", width: 34 },
          { header: "Recargo", kind: "percent" },
        ],
        rows: ctx.labor.overtime.map((o) => [o.label, o.surcharge]),
      },
    ],
  });
  const lists = addListsSheet(wb, theme, [
    { key: "employees", title: "Empleados", values: config.employees },
  ]);

  addSheetHeader(ws, {
    title: titleWith("Registro de horas extra", config.businessName),
    subtitle: `Período: ${period}. Valor hora = salario mensual ÷ días del mes ÷ horas de la jornada.`,
    theme,
    width: 10,
  });
  const otTypes = ctx.labor.overtime.map((o) => o.label);
  const table = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "employee",
        header: "Empleado",
        kind: "list",
        width: 24,
        list: { source: lists.source("employees") },
      },
      { key: "salary", header: "Salario mensual", kind: "currency", width: 15 },
      {
        key: "shift",
        header: "Jornada",
        kind: "list",
        width: 11,
        list: { source: params.tableColumn("jornadas", 0) },
        fill: JORNADAS[0],
      },
      {
        key: "type",
        header: "Tipo de hora extra",
        kind: "list",
        width: 30,
        list: { source: params.tableColumn("overtime", 0) },
        fill: otTypes[0],
      },
      { key: "hours", header: "Horas", kind: "number", width: 9, total: "sum" },
      {
        key: "hourValue",
        header: "Valor hora ordinaria",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          blankUnlessAll(
            [r.c("salary"), r.c("shift")],
            `${r.c("salary")}/${params.ref("days:month")}/VLOOKUP(${r.c("shift")},${params.table("jornadas")},2,0)`,
          ),
      },
      {
        key: "surcharge",
        header: "Recargo",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(${r.c("type")}="","",IFERROR(VLOOKUP(${r.c("type")},${params.table("overtime")},2,0),0))`,
      },
      {
        key: "otValue",
        header: "Valor hora extra",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(OR(${r.c("hourValue")}="",${r.c("surcharge")}=""),"",${r.c("hourValue")}*(1+${r.c("surcharge")}))`,
      },
      {
        key: "total",
        header: "Total a pagar",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("hours")}="",${r.c("otValue")}=""),"",ROUND(${r.c("hours")}*${r.c("otValue")},2))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: config.example
      ? [
          {
            date: exampleDate(config.year, config.month, 3),
            employee: config.employees[0],
            salary: 14400,
            hours: 3,
          },
          {
            date: exampleDate(config.year, config.month, 5),
            employee: config.employees[0],
            salary: 14400,
            type: otTypes[1],
            hours: 2,
          },
          {
            date: exampleDate(config.year, config.month, 9),
            employee: config.employees[1] ?? config.employees[0],
            salary: 12600,
            shift: JORNADAS[1],
            type: otTypes[2] ?? otTypes[0],
            hours: 2,
          },
        ]
      : undefined,
  });

  addSheetHeader(summary, { title: "Resumen por empleado", subtitle: period, theme, width: 3 });
  const totals = addFields(summary, {
    startRow: 4,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "hours",
        label: "Total de horas extra",
        kind: "calc",
        resultKind: "number",
        formula: () => table.sheetTotal("hours"),
      },
      {
        key: "amount",
        label: "Total a pagar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.sheetTotal("total"),
      },
    ],
    theme,
    ctx,
  });
  addCategorySummary(summary, {
    startRow: totals.nextRow + 1,
    startCol: 1,
    labelHeader: "Empleado",
    labelWidth: 28,
    sourceCells: cellsOfRange(lists.source("employees")),
    values: [
      {
        header: "Horas",
        kind: "number",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIF(${table.sheetRange("employee")},${k.labelCell},${table.sheetRange("hours")})`,
          ),
      },
      {
        header: "A pagar",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIF(${table.sheetRange("employee")},${k.labelCell},${table.sheetRange("total")})`,
          ),
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);
  await protectSheet(summary);

  addInstructionsSheet(wb, {
    title: "Horas extra",
    description:
      "Calcula el pago de las horas extra con el valor de la hora ordinaria y el recargo que corresponde.",
    steps: [
      "Agrega los nombres de los empleados en la hoja Listas.",
      "En Horas extra registra la fecha, el empleado, su salario mensual, la jornada, el tipo de hora extra y la cantidad de horas.",
      "El valor de la hora, el recargo y el total se calculan solos con los valores de la hoja Parámetros.",
      "La hoja Resumen muestra el total por empleado; pásalo a la planilla en la columna Horas extra.",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
