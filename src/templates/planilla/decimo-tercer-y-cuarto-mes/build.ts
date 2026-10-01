import "server-only";

import { addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet, type ParamRow } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable, type ColumnDef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import { EXAMPLE_EMPLOYEES } from "../shared/form";
import type { DecimosConfig } from "./form";

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

export const build: TemplateBuild<DecimosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith(`Décimos ${config.year}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Décimos", {
    freezeRows: 4,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const y = config.year;
  const t13 = ctx.labor.thirteenthMonth;
  const t14 = ctx.labor.fourteenthMonth;
  const has13 = config.include.includes("thirteenth");
  const has14 = config.include.includes("fourteenth");
  // Un período que "cruza" el año (julio a junio) empieza el año anterior.
  const start14Year = t14.periodStart.month > t14.periodEnd.month ? y - 1 : y;

  const rows: ParamRow[] = [
    {
      key: "days:year",
      label: "Días por año (base comercial)",
      value: ctx.labor.dayBasis,
      kind: "integer",
    },
  ];
  if (has13) {
    rows.push(
      {
        key: "p13:start",
        label: `${t13.label}: inicio del período`,
        value: utc(y, t13.periodStart.month, t13.periodStart.day),
        kind: "date",
      },
      {
        key: "p13:end",
        label: `${t13.label}: fin del período`,
        value: utc(y, t13.periodEnd.month, t13.periodEnd.day),
        kind: "date",
      },
    );
  }
  if (has14) {
    rows.push(
      {
        key: "p14:start",
        label: `${t14.label}: inicio del período`,
        value: utc(start14Year, t14.periodStart.month, t14.periodStart.day),
        kind: "date",
      },
      {
        key: "p14:end",
        label: `${t14.label}: fin del período`,
        value: utc(y, t14.periodEnd.month, t14.periodEnd.day),
        kind: "date",
      },
    );
  }
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [{ title: "Períodos de cálculo", rows }],
  });
  const p = params.ref;

  const periodColumns = (id: "13" | "14", label: string): ColumnDef[] => [
    {
      key: `days${id}`,
      header: `Días en el período (${label})`,
      kind: "formula",
      resultKind: "integer",
      width: 13,
      align: "center",
      formula: (r) => {
        const from = `MAX(${r.c("start")},${p(`p${id}:start`)})`;
        const to = `IF(${r.c("end")}="",${p(`p${id}:end`)},MIN(${r.c("end")},${p(`p${id}:end`)}))`;
        return `IF(OR(${r.c("start")}="",${r.c("salary")}=""),"",IF(${to}<${from},0,MIN(${p("days:year")},DAYS360(${from},${to},1)+1)))`;
      },
    },
    {
      key: `amount${id}`,
      header: label,
      kind: "formula",
      resultKind: "currency",
      width: 16,
      total: "sum",
      formula: (r) =>
        `IF(${r.c(`days${id}`)}="","",ROUND(${r.c("salary")}*${r.c(`days${id}`)}/${p("days:year")},2))`,
    },
  ];

  const columns: ColumnDef[] = [
    { key: "name", header: "Empleado", kind: "text", width: 26 },
    { key: "dni", header: ctx.taxId.personalIdName, kind: "text", width: 16 },
    { key: "start", header: "Fecha de ingreso", kind: "date", width: 13 },
    { key: "end", header: "Fecha de salida (si aplica)", kind: "date", width: 14 },
    { key: "salary", header: "Salario mensual ordinario", kind: "currency", width: 16 },
    ...(has13 ? periodColumns("13", t13.label) : []),
    ...(has14 ? periodColumns("14", t14.label) : []),
  ];
  if (has13 && has14) {
    columns.push({
      key: "total",
      header: "Total",
      kind: "formula",
      resultKind: "currency",
      width: 16,
      total: "sum",
      formula: (r) => `IF(${r.c("salary")}="","",${r.c("amount13")}+${r.c("amount14")})`,
    });
  }

  addSheetHeader(ws, {
    title: titleWith(`Décimos ${y}`, config.businessName),
    subtitle: [
      has13 ? `${t13.label}: pago en ${t13.paymentDeadline}` : "",
      has14 ? `${t14.label}: pago en ${t14.paymentDeadline}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    theme,
    width: columns.length,
  });
  addTable(ws, {
    startRow: 4,
    columns,
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 44,
    example: config.example
      ? [
          { ...EXAMPLE_EMPLOYEES[0], start: "2019-02-01" },
          { ...EXAMPLE_EMPLOYEES[1], start: `${y}-04-01` },
          { ...EXAMPLE_EMPLOYEES[2], start: `${y - 1}-10-01` },
          { ...EXAMPLE_EMPLOYEES[3], start: "2015-01-15", end: `${y}-03-31` },
        ]
      : undefined,
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Décimo tercer y cuarto mes",
    description:
      "Calcula el aguinaldo y el décimo cuarto mes de cada empleado, completo o proporcional al tiempo trabajado.",
    steps: [
      "Revisa en Parámetros los períodos de cálculo (se generan según el año elegido).",
      "Escribe cada empleado con su fecha de ingreso y su salario mensual ordinario. Si ya no trabaja, indica la fecha de salida.",
      "Los días trabajados en cada período se cuentan con base comercial de 360 días y el monto se calcula en proporción.",
      "Quien trabajó el período completo recibe un salario mensual completo.",
    ],
    tips: [
      "Si el salario cambió durante el año, confirma con tu contador qué salario corresponde usar (último u ordinario promedio).",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
