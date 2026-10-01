import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addr, colLetter, formulaString } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  solidFill,
  styleCalc,
  styleHeader,
  styleInput,
  thinBorder,
} from "@/lib/excel/styles";
import { listFromRange } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { AsistenciaConfig } from "./form";

export const ATTENDANCE_CODES = [
  { code: "P", label: "Presente", color: "#FFFFFF" },
  { code: "T", label: "Tardanza", color: "#FFF1C7" },
  { code: "A", label: "Ausente", color: "#FDE2E1" },
  { code: "PE", label: "Permiso", color: "#E3ECFA" },
  { code: "V", label: "Vacaciones", color: "#DDF2E4" },
  { code: "I", label: "Incapacidad", color: "#EEE3F7" },
  { code: "F", label: "Feriado / descanso", color: "#ECEFF1" },
];

export const build: TemplateBuild<AsistenciaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Control de asistencia", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Asistencia", {
    freezeRows: 7,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const lists = addListsSheet(wb, theme, [
    { key: "codes", title: "Códigos", values: ATTENDANCE_CODES.map((c) => c.code), spare: 3 },
  ]);

  addSheetHeader(ws, {
    title: titleWith("Control de asistencia", config.businessName),
    subtitle: "Escribe un código por día. Los días del mes y los totales se calculan solos.",
    theme,
    width: 20,
  });
  const period = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 2,
    fields: [
      { key: "month", label: "Mes (1 a 12)", kind: "integer", value: config.month },
      { key: "year", label: "Año", kind: "integer", value: config.year },
    ],
    theme,
    ctx,
  });
  const M = period.cell("month");
  const Y = period.cell("year");

  // Leyenda de códigos
  ATTENDANCE_CODES.forEach((c, i) => {
    const col = 6 + i * 3;
    const cell = ws.getCell(3, col);
    cell.value = c.code;
    cell.fill = solidFill(c.color);
    cell.border = thinBorder(theme.border);
    cell.alignment = { horizontal: "center" };
    cell.font = font(theme, { bold: true });
    ws.mergeCells(3, col + 1, 3, col + 2);
    const l = ws.getCell(3, col + 1);
    l.value = c.label;
    l.font = font(theme, { size: 9, color: theme.muted });
  });

  const headerRow = 6;
  const dowRow = 7;
  const first = 8;
  const rows = config.employees.length + config.spareRows;
  const last = first + rows - 1;
  ws.getColumn(1).width = 26;
  const nameHeader = ws.getCell(headerRow, 1);
  nameHeader.value = "Empleado";
  styleHeader(nameHeader, theme);
  ws.mergeCells(headerRow, 1, dowRow, 1);

  const dayCol = (d: number) => 1 + d;
  for (let d = 1; d <= 31; d++) {
    const col = dayCol(d);
    ws.getColumn(col).width = 4.2;
    const date = `DATE(${Y},${M},${d})`;
    const h = ws.getCell(headerRow, col);
    h.value = { formula: `IF(MONTH(${date})=${M},${d},"")` };
    styleHeader(h, theme);
    const dow = ws.getCell(dowRow, col);
    dow.value = {
      formula: `IF(${addr(col, headerRow)}="","",CHOOSE(WEEKDAY(${date}),"D","L","M","M","J","V","S"))`,
    };
    styleCalc(dow, theme);
    dow.alignment = { horizontal: "center" };
    dow.font = font(theme, { size: 9, bold: true });
  }
  const firstDay = colLetter(dayCol(1));
  const lastDay = colLetter(dayCol(31));
  // Fines de semana sombreados
  highlightWhen(
    ws,
    `${firstDay}${dowRow}:${lastDay}${last}`,
    `OR(${firstDay}$${dowRow}="S",${firstDay}$${dowRow}="D")`,
    { fill: "#F1F4F2" },
    10,
  );

  const summaryCodes = ATTENDANCE_CODES.map((c) => c.code);
  const summaryStart = dayCol(31) + 1;
  summaryCodes.forEach((code, i) => {
    const col = summaryStart + i;
    ws.getColumn(col).width = 6;
    const h = ws.getCell(headerRow, col);
    h.value = code;
    styleHeader(h, theme);
    ws.mergeCells(headerRow, col, dowRow, col);
  });
  const pctCol = summaryStart + summaryCodes.length;
  ws.getColumn(pctCol).width = 11;
  const ph = ws.getCell(headerRow, pctCol);
  ph.value = "% asistencia";
  styleHeader(ph, theme);
  ws.mergeCells(headerRow, pctCol, dowRow, pctCol);

  for (let r = first; r <= last; r++) {
    const idx = r - first;
    const name = ws.getCell(r, 1);
    name.value = config.employees[idx] ?? null;
    styleInput(name, theme, idx % 2 ? theme.zebra : "#FFFFFF");
    for (let d = 1; d <= 31; d++) {
      const cell = ws.getCell(r, dayCol(d));
      styleInput(cell, theme, "#FFFFFF");
      cell.alignment = { horizontal: "center" };
      if (config.example && idx < 3 && d <= 10) {
        const sample = [
          "P",
          "P",
          "T",
          "P",
          "P",
          "F",
          "F",
          "P",
          idx === 1 ? "A" : "P",
          idx === 2 ? "V" : "P",
        ];
        cell.value = sample[d - 1] ?? null;
      }
    }
    const rowRange = `${firstDay}${r}:${lastDay}${r}`;
    summaryCodes.forEach((code, i) => {
      const c = ws.getCell(r, summaryStart + i);
      c.value = { formula: `IF($A${r}="","",COUNTIF(${rowRange},${formulaString(code)}))` };
      styleCalc(c, theme);
      c.alignment = { horizontal: "center" };
    });
    const pCol = colLetter(summaryStart);
    const tCol = colLetter(summaryStart + 1);
    const fCol = colLetter(summaryStart + summaryCodes.indexOf("F"));
    const pct = ws.getCell(r, pctCol);
    pct.value = {
      formula: `IF(OR($A${r}="",COUNTA(${rowRange})-${fCol}${r}=0),"",(${pCol}${r}+${tCol}${r})/(COUNTA(${rowRange})-${fCol}${r}))`,
    };
    styleCalc(pct, theme);
    pct.numFmt = "0%";
  }
  listFromRange(ws, `${firstDay}${first}:${lastDay}${last}`, lists.source("codes"));
  ATTENDANCE_CODES.filter((c) => c.code !== "P").forEach((c, i) => {
    highlightWhen(
      ws,
      `${firstDay}${first}:${lastDay}${last}`,
      `${firstDay}${first}=${formulaString(c.code)}`,
      { fill: c.color },
      i + 1,
    );
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Control de asistencia",
    description:
      "Registra la asistencia diaria de tu personal y obtén el resumen del mes por empleado.",
    steps: [
      "Escribe el mes y el año: los días y los días de la semana se ajustan solos.",
      "Escribe o elige en la lista el código de cada día para cada empleado.",
      `Códigos: ${ATTENDANCE_CODES.map((c) => `${c.code} = ${c.label}`).join(", ")}.`,
      "Al final de cada fila verás el conteo por código y el porcentaje de asistencia.",
    ],
    tips: [
      "Para otro mes, guarda una copia del archivo y cambia el mes; borra los códigos anteriores.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
