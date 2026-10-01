import "server-only";

import { amountInWordsRef } from "@/lib/excel/amount-in-words";
import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { font, makeTheme, styleNote } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { PrestacionesConfig } from "./form";

export const build: TemplateBuild<PrestacionesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const labor = ctx.labor;
  const wb = createWorkbook({
    title: titleWith("Cálculo de prestaciones laborales", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Prestaciones", {
    paper: config.paper,
    showGridLines: false,
    tabColor: theme.primary,
  });
  ws.getColumn(1).width = 2;
  ws.getColumn(2).width = 44;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 4;
  ws.getColumn(5).width = 40;
  ws.getColumn(6).width = 18;

  const daysMonth = labor.dayBasis / 12;
  const toDays = (value: number, unit: "days" | "weeks" | "months") =>
    unit === "days" ? value : unit === "weeks" ? value * 7 : value * daysMonth;

  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Bases y topes",
        rows: [
          {
            key: "days:month",
            label: "Días por mes (base comercial)",
            value: daysMonth,
            kind: "integer",
          },
          {
            key: "days:year",
            label: "Días por año (base comercial)",
            value: labor.dayBasis,
            kind: "integer",
          },
          {
            key: "sev:monthsPerYear",
            label: "Cesantía: meses de salario por año trabajado",
            value: labor.severance.monthsPerYear,
            kind: "number",
          },
          {
            key: "sev:max",
            label: "Cesantía: máximo de meses a pagar",
            value: labor.severance.maxMonths,
            kind: "integer",
          },
          {
            key: "p13:month",
            label: `${labor.thirteenthMonth.label}: mes de inicio del período`,
            value: labor.thirteenthMonth.periodStart.month,
            kind: "integer",
          },
          {
            key: "p13:day",
            label: `${labor.thirteenthMonth.label}: día de inicio`,
            value: labor.thirteenthMonth.periodStart.day,
            kind: "integer",
          },
          {
            key: "p14:month",
            label: `${labor.fourteenthMonth.label}: mes de inicio del período`,
            value: labor.fourteenthMonth.periodStart.month,
            kind: "integer",
          },
          {
            key: "p14:day",
            label: `${labor.fourteenthMonth.label}: día de inicio`,
            value: labor.fourteenthMonth.periodStart.day,
            kind: "integer",
          },
        ],
      },
    ],
    tables: [
      {
        key: "reasons",
        title: "Prestaciones según motivo de terminación",
        columns: [
          { header: "Motivo", kind: "text", width: 36 },
          { header: "Paga preaviso", kind: "text" },
          { header: "Paga cesantía", kind: "text" },
        ],
        rows: labor.terminationReasons.map((r) => [
          r.label,
          r.notice ? "Sí" : "No",
          r.severance ? "Sí" : "No",
        ]),
      },
      {
        key: "notice",
        title: "Preaviso por antigüedad",
        columns: [
          { header: "Desde (meses)", kind: "integer" },
          { header: "Días de salario", kind: "integer" },
          { header: "Equivale a", kind: "text" },
        ],
        rows: labor.noticePeriod.map((s) => [s.fromMonths, toDays(s.value, s.unit), s.label]),
      },
      {
        key: "sevUnder",
        title: "Cesantía con menos de un año",
        columns: [
          { header: "Desde (meses)", kind: "integer" },
          { header: "Días de salario", kind: "integer" },
          { header: "Descripción", kind: "text" },
        ],
        rows: labor.severance.underOneYear.map((s) => [
          s.fromMonths,
          toDays(s.value, s.unit),
          s.label,
        ]),
      },
      {
        key: "vacation",
        title: "Vacaciones por antigüedad",
        columns: [
          { header: "Desde (años)", kind: "integer" },
          { header: "Días", kind: "integer" },
        ],
        rows: labor.vacationDays.map((v) => [v.fromYears, v.days]),
      },
    ],
  });
  const p = params.ref;
  const reasons = params.table("reasons");
  const notice = params.table("notice");
  const sevUnder = params.table("sevUnder");
  const vacation = params.table("vacation");

  addSheetHeader(ws, {
    title: "Cálculo de prestaciones laborales",
    subtitle: config.businessName
      ? `Empleador: ${config.businessName}`
      : "Liquidación estimada al terminar la relación laboral",
    theme,
    width: 5,
    startCol: 2,
  });

  const input = addFields(ws, {
    startRow: 4,
    labelCol: 2,
    valueCol: 3,
    title: "Datos del trabajador",
    fields: [
      {
        key: "name",
        label: "Nombre del trabajador",
        kind: "text",
        value: config.example ? "Marta Elena Sánchez" : null,
      },
      {
        key: "dni",
        label: ctx.taxId.personalIdName,
        kind: "text",
        value: config.example ? "0801-1987-04512" : null,
      },
      {
        key: "start",
        label: "Fecha de ingreso",
        kind: "date",
        value: config.example ? "2021-03-15" : null,
      },
      {
        key: "end",
        label: "Fecha de salida",
        kind: "date",
        value: config.example ? "2026-06-30" : null,
      },
      {
        key: "reason",
        label: "Motivo de terminación",
        kind: "list",
        list: { source: params.tableColumn("reasons", 0) },
        value: labor.terminationReasons[0]?.label,
      },
      {
        key: "salary",
        label: "Último salario mensual ordinario",
        kind: "currency",
        value: config.example ? 18000 : null,
      },
      {
        key: "avg",
        label: "Salario promedio mensual (últimos 6 meses)",
        kind: "currency",
        value: config.example ? 18500 : null,
        note: "Se usa para preaviso y cesantía.",
      },
      {
        key: "vacPending",
        label: "Días de vacaciones pendientes de años anteriores",
        kind: "integer",
        value: config.example ? 5 : 0,
      },
      {
        key: "salaryDays",
        label: "Días de salario trabajados y no pagados",
        kind: "integer",
        value: config.example ? 15 : 0,
      },
      {
        key: "paid13",
        label: `¿Ya se pagó el ${labor.thirteenthMonth.label.toLowerCase()} de este año?`,
        kind: "list",
        list: ["Sí", "No"],
        value: "No",
      },
      {
        key: "paid14",
        label: `¿Ya se pagó el ${labor.fourteenthMonth.label.toLowerCase()} del período?`,
        kind: "list",
        list: ["Sí", "No"],
        value: "No",
      },
    ],
    theme,
    ctx,
  });
  const c = input.cell;

  const calc = addFields(ws, {
    startRow: 4,
    labelCol: 5,
    valueCol: 6,
    title: "Datos del cálculo",
    fields: [
      {
        key: "d360",
        label: "Tiempo de servicio (días, base 360)",
        kind: "calc",
        resultKind: "integer",
        formula: () =>
          `IF(OR(${c("start")}="",${c("end")}=""),0,MAX(0,DAYS360(${c("start")},${c("end")},1)+1))`,
      },
      {
        key: "years",
        label: "Años completos",
        kind: "calc",
        resultKind: "integer",
        formula: (r) => `INT(${r("d360")}/${p("days:year")})`,
      },
      {
        key: "months",
        label: "Meses completos",
        kind: "calc",
        resultKind: "integer",
        formula: (r) => `INT(${r("d360")}/${p("days:month")})`,
      },
      {
        key: "dailyAvg",
        label: "Salario diario promedio",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${c("avg")}/${p("days:month")}`,
      },
      {
        key: "dailyOrd",
        label: "Salario diario ordinario",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${c("salary")}/${p("days:month")}`,
      },
      {
        key: "payNotice",
        label: "¿Corresponde preaviso?",
        kind: "calc",
        formula: () => `IFERROR(VLOOKUP(${c("reason")},${reasons},2,0),"No")`,
      },
      {
        key: "paySeverance",
        label: "¿Corresponde cesantía?",
        kind: "calc",
        formula: () => `IFERROR(VLOOKUP(${c("reason")},${reasons},3,0),"No")`,
      },
      {
        key: "noticeDays",
        label: "Días de preaviso",
        kind: "calc",
        resultKind: "integer",
        formula: (r) =>
          `IF(${r("payNotice")}="Sí",IFERROR(VLOOKUP(${r("months")},${notice},2,1),0),0)`,
      },
      {
        key: "vacEntitled",
        label: "Días de vacaciones del año de servicio en curso",
        kind: "calc",
        resultKind: "integer",
        formula: (r) => `IFERROR(VLOOKUP(${r("years")}+1,${vacation},2,1),0)`,
      },
      {
        key: "vacDays",
        label: "Días de vacaciones proporcionales",
        kind: "calc",
        resultKind: "number",
        formula: (r) =>
          `(${r("d360")}-${r("years")}*${p("days:year")})/${p("days:year")}*${r("vacEntitled")}`,
      },
      {
        key: "start14",
        label: `Inicio del período del ${labor.fourteenthMonth.label.toLowerCase()}`,
        kind: "calc",
        resultKind: "date",
        formula: () =>
          `IF(${c("end")}="","",DATE(YEAR(${c("end")})-IF(${c("end")}<DATE(YEAR(${c("end")}),${p("p14:month")},${p("p14:day")}),1,0),${p("p14:month")},${p("p14:day")}))`,
      },
    ],
    theme,
    ctx,
  });
  const r = calc.cell;

  const summaryStart = Math.max(input.nextRow, calc.nextRow) + 1;
  const result = addFields(ws, {
    startRow: summaryStart,
    labelCol: 2,
    valueCol: 3,
    title: "Resumen de prestaciones",
    fields: [
      {
        key: "notice",
        label: "Preaviso",
        kind: "calc",
        resultKind: "currency",
        formula: () => `ROUND(${r("noticeDays")}*${r("dailyAvg")},2)`,
      },
      {
        key: "severance",
        label: "Auxilio de cesantía",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `IF(${r("paySeverance")}<>"Sí",0,IF(${r("months")}<12,ROUND(IFERROR(VLOOKUP(${r("months")},${sevUnder},2,1),0)*${r("dailyAvg")},2),ROUND(MIN(${p("sev:max")},${r("d360")}/${p("days:year")}*${p("sev:monthsPerYear")})*${c("avg")},2)))`,
      },
      {
        key: "vacation",
        label: "Vacaciones proporcionales",
        kind: "calc",
        resultKind: "currency",
        formula: () => `ROUND(${r("vacDays")}*${r("dailyOrd")},2)`,
      },
      {
        key: "vacPending",
        label: "Vacaciones pendientes",
        kind: "calc",
        resultKind: "currency",
        formula: () => `ROUND(${c("vacPending")}*${r("dailyOrd")},2)`,
      },
      {
        key: "d13",
        label: `${labor.thirteenthMonth.label} proporcional`,
        kind: "calc",
        resultKind: "currency",
        formula: () => {
          const from = `MAX(${c("start")},DATE(YEAR(${c("end")}),${p("p13:month")},${p("p13:day")}))`;
          return `IF(OR(${c("paid13")}="Sí",${c("end")}=""),0,ROUND(${c("salary")}*MIN(${p("days:year")},MAX(0,DAYS360(${from},${c("end")},1)+1))/${p("days:year")},2))`;
        },
      },
      {
        key: "d14",
        label: `${labor.fourteenthMonth.label} proporcional`,
        kind: "calc",
        resultKind: "currency",
        formula: () => {
          const from = `MAX(${c("start")},${r("start14")})`;
          return `IF(OR(${c("paid14")}="Sí",${c("end")}=""),0,ROUND(${c("salary")}*MIN(${p("days:year")},MAX(0,DAYS360(${from},${c("end")},1)+1))/${p("days:year")},2))`;
        },
      },
      {
        key: "pendingSalary",
        label: "Salarios pendientes",
        kind: "calc",
        resultKind: "currency",
        formula: () => `ROUND(${c("salaryDays")}*${r("dailyOrd")},2)`,
      },
      {
        key: "total",
        label: "TOTAL A PAGAR",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) =>
          ["notice", "severance", "vacation", "vacPending", "d13", "d14", "pendingSalary"]
            .map((k) => ref(k))
            .join("+"),
      },
    ],
    theme,
    ctx,
  });
  let row = result.nextRow + 1;
  const words = amountInWordsRef(wb, `'${ws.name}'!${result.cell("total")}`, ctx);
  ws.mergeCells(row, 2, row, 6);
  const w = ws.getCell(row, 2);
  w.value = { formula: `"Son: "&${words}` };
  w.font = font(theme, { bold: true });
  row += 2;
  ws.mergeCells(row, 2, row, 6);
  const note = ws.getCell(row, 2);
  note.value =
    "Cálculo de referencia. Las prestaciones pueden variar por pactos colectivos, salarios variables o resoluciones de la Secretaría de Trabajo.";
  styleNote(note, theme);
  row += 4;
  for (const [col, label] of [
    [2, "Firma del trabajador"],
    [5, "Firma del empleador"],
  ] as const) {
    const cell = ws.getCell(row, col);
    cell.value = label;
    cell.border = { top: { style: "thin" } };
    cell.alignment = { horizontal: "center" };
  }
  ws.pageSetup.printArea = `A1:F${row}`;
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Cálculo de prestaciones laborales",
    description:
      "Estima la liquidación de un trabajador al terminar la relación laboral, según su antigüedad y el motivo de salida.",
    steps: [
      "Escribe los datos del trabajador: fechas de ingreso y salida, motivo de terminación y salarios.",
      "Indica los días de vacaciones pendientes de años anteriores y los días trabajados aún no pagados.",
      "Marca si ya se pagaron el décimo tercer o el décimo cuarto mes del período.",
      "El preaviso y la cesantía se calculan solo si el motivo de terminación los incluye (tabla en Parámetros).",
      "Revisa el resumen, imprime la hoja y fírmenla ambas partes.",
    ],
    tips: [
      "El tiempo de servicio se cuenta con base comercial de 360 días (meses de 30 días).",
      "Preaviso y cesantía usan el salario promedio de los últimos seis meses; vacaciones y décimos, el salario ordinario.",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
