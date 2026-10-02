import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
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
import { addTable, type ColumnDef } from "@/lib/excel/table";
import { listFromRange } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { HorarioConfig } from "./form";

const SUBJECT_COLORS = [
  "#DCEBF7",
  "#E2F0D9",
  "#FFF2CC",
  "#FCE4D6",
  "#EDE1F5",
  "#DDF3F2",
  "#F8DCE6",
  "#E7E6E6",
  "#FFE8B3",
  "#D9EAD3",
  "#CFE2F3",
  "#F4CCCC",
];
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const TIME_FMT = "h:mm AM/PM";
const TEACHERS = ["Prof. Zavala", "Prof. Mendoza", "Prof. Castro"];

export const build: TemplateBuild<HorarioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Horario de clases", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const subj = addSheet(wb, "Materias", { freezeRows: 4, tabColor: theme.highlight });
  const days = DAYS.slice(0, config.saturdays ? 6 : 5);
  const ex = config.example;
  const [hh, mm] = config.start.split(":").map(Number);

  addSheetHeader(subj, {
    title: "Materias, docentes y horario base",
    subtitle: "Cambia las horas aquí: se actualizan todos los horarios.",
    theme,
    width: 5,
  });
  const base = addFields(subj, {
    startRow: 3,
    labelCol: 7,
    valueCol: 8,
    fields: [
      {
        key: "start",
        label: "Hora de entrada",
        kind: "number",
        value: ((hh ?? 7) * 60 + (mm ?? 0)) / 1440,
      },
      { key: "minutes", label: "Minutos por periodo", kind: "integer", value: config.minutes },
      {
        key: "breakAfter",
        label: "Recreo después del periodo",
        kind: "integer",
        value: config.breakAfter,
      },
      {
        key: "breakMinutes",
        label: "Minutos de recreo",
        kind: "integer",
        value: config.breakMinutes,
      },
    ],
    theme,
    ctx,
  });
  subj.getCell(base.cell("start").replace(/\$/g, "")).numFmt = TIME_FMT;
  subj.getColumn(7).width = 26;
  const B = (k: string) => base.ref(k);
  const groupSheets = config.groups.map((g, i) => ({ label: g, sheet: `H${i + 1}` }));

  // Hojas de horario (una por grado)
  const scheduleRanges: string[] = [];
  const subjectsRange = `'Materias'!$A$5:$A$${4 + config.subjects.length + 10}`;
  for (const [gi, group] of config.groups.entries()) {
    const ws = addSheet(wb, group, { tabColor: theme.primary, landscape: true });
    addSheetHeader(ws, {
      title: `Horario — ${group}`,
      subtitle: config.businessName || "Horario semanal de clases",
      theme,
      width: days.length + 2,
    });
    ws.getColumn(1).width = 9;
    ws.getColumn(2).width = 13;
    days.forEach((_, i) => (ws.getColumn(3 + i).width = 18));
    const headRow = 4;
    ["Periodo", "Hora"].concat(days).forEach((h, i) => {
      const c = ws.getCell(headRow, i + 1);
      c.value = h;
      styleHeader(c, theme);
    });
    let row = headRow + 1;
    const firstRow = row;
    for (let p = 1; p <= config.periods; p++) {
      const pc = ws.getCell(row, 1);
      pc.value = p;
      styleCalc(pc, theme);
      pc.alignment = { horizontal: "center", vertical: "middle" };
      const tc = ws.getCell(row, 2);
      const startExpr = `${B("start")}+((${p - 1})*${B("minutes")}+IF(AND(${B("breakAfter")}>0,${p}>${B("breakAfter")}),${B("breakMinutes")},0))/1440`;
      tc.value = {
        formula: `TEXT(${startExpr},"h:mm")&" - "&TEXT(${startExpr}+${B("minutes")}/1440,"h:mm")`,
      };
      styleCalc(tc, theme);
      tc.alignment = { horizontal: "center", vertical: "middle" };
      days.forEach((_, d) => {
        const c = ws.getCell(row, 3 + d);
        styleInput(c, theme, "#FFFFFF");
        c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        if (ex && gi === 0) c.value = config.subjects[(p + d * 2) % config.subjects.length] ?? null;
      });
      ws.getRow(row).height = 30;
      row++;
      if (p === config.breakAfter && config.breakMinutes > 0 && p < config.periods) {
        ws.mergeCells(row, 1, row, 2 + days.length);
        const rc = ws.getCell(row, 1);
        rc.value = { formula: `"RECREO  ("&${B("breakMinutes")}&" minutos)"` };
        rc.fill = solidFill(theme.calc);
        rc.font = font(theme, { bold: true, color: theme.muted });
        rc.alignment = { horizontal: "center", vertical: "middle" };
        rc.border = thinBorder(theme.border);
        row++;
      }
    }
    const lastRow = row - 1;
    const grid = `C${firstRow}:${ws.getColumn(2 + days.length).letter}${lastRow}`;
    listFromRange(ws, grid, subjectsRange);
    config.subjects.slice(0, SUBJECT_COLORS.length).forEach((_, i) => {
      highlightWhen(
        ws,
        grid,
        `AND(C${firstRow}<>"",C${firstRow}='Materias'!$A$${5 + i})`,
        { fill: SUBJECT_COLORS[i]! },
        i + 1,
      );
    });
    scheduleRanges.push(`'${ws.name}'!${grid.replace(/([A-Z]+)(\d+)/g, "$$$1$$$2")}`);
    groupSheets[gi]!.sheet = ws.name;
    await protectSheet(ws);
  }

  // Materias con su carga semanal
  const countIn = (subjectCell: string) =>
    scheduleRanges.map((r) => `COUNTIF(${r},${subjectCell})`).join("+");
  const columns: ColumnDef[] = [
    { key: "subject", header: "Materia", kind: "text", width: 24 },
    { key: "teacher", header: "Docente", kind: "text", width: 24 },
    {
      key: "periods",
      header: "Periodos por semana",
      kind: "formula",
      resultKind: "integer",
      width: 12,
      total: "sum",
      formula: (r) => `IF(${r.c("subject")}="","",${countIn(r.c("subject"))})`,
    },
    {
      key: "hours",
      header: "Horas por semana",
      kind: "formula",
      resultKind: "number",
      width: 12,
      total: "sum",
      formula: (r) => `IF(${r.c("subject")}="","",${r.c("periods")}*${B("minutes")}/60)`,
    },
  ];
  const mt = addTable(subj, {
    startRow: 4,
    columns,
    rows: config.subjects.length + 10,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: config.subjects.map((subject, i) => ({
      subject,
      teacher: ex ? TEACHERS[i % TEACHERS.length] : undefined,
    })),
  });
  config.subjects.slice(0, SUBJECT_COLORS.length).forEach((_, i) => {
    subj.getCell(mt.firstRow + i, 1).fill = solidFill(SUBJECT_COLORS[i]!);
  });
  const tt = addTable(subj, {
    startRow: mt.totalRow! + 3,
    columns: [
      { key: "teacher", header: "Nombre del docente", kind: "text", width: 24 },
      {
        key: "groups",
        header: "Materias que imparte",
        kind: "formula",
        resultKind: "integer",
        width: 24,
        formula: (r) =>
          `IF(${r.c("teacher")}="","",COUNTIF(${mt.range("teacher")},${r.c("teacher")}))`,
      },
      {
        key: "periods",
        header: "Periodos por semana",
        kind: "formula",
        resultKind: "integer",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("teacher")}="","",SUMIFS(${mt.range("periods")},${mt.range("teacher")},${r.c("teacher")}))`,
      },
      {
        key: "hours",
        header: "Horas por semana",
        kind: "formula",
        resultKind: "number",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("teacher")}="","",SUMIFS(${mt.range("hours")},${mt.range("teacher")},${r.c("teacher")}))`,
      },
    ],
    rows: 30,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex ? TEACHERS.map((teacher) => ({ teacher })) : undefined,
  });
  listFromRange(subj, mt.range("teacher", false), tt.range("teacher"));
  await protectSheet(subj);

  addInstructionsSheet(wb, {
    title: "Horario de clases",
    description: "Arma el horario de cada grado y revisa la carga de cada docente.",
    steps: [
      "En Materias revisa la hora de entrada, los minutos por periodo y el recreo: las horas se calculan solas.",
      "Escribe los docentes en la tabla Nombre del docente y elige el docente de cada materia.",
      `En cada hoja de grado elige la materia de cada periodo en la lista; cada materia tiene su color (${groupSheets.map((g) => g.label).join(", ")}).`,
      "Materias muestra cuántos periodos y horas por semana tiene cada materia y cada docente.",
    ],
    tips: [
      "Imprime cada hoja de grado en horizontal para pegarla en el aula.",
      "Escribe los docentes en la tabla de abajo y luego elígelos en cada materia: su carga se suma sola.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 1);
  return wb;
};
