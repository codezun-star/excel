import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme, solidFill, styleCalc, styleHeader, styleInput } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { listFromRange } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { EstudioConfig } from "./form";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const COLORS = [
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
  "#D0E0E3",
  "#FDE9D9",
  "#EAD1DC",
];

const hourLabel = (h: number) => {
  const suffix = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
};

export const build: TemplateBuild<EstudioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Planificador de estudio", config.student);
  const wb = createWorkbook({ title, ctx, options });
  const subj = addSheet(wb, "Materias", { freezeRows: 6, tabColor: theme.primary });
  const week = addSheet(wb, "Horario", {
    freezeRows: 4,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const log = addSheet(wb, "Sesiones", { freezeRows: 4, tabColor: theme.primary });
  const todo = addSheet(wb, "Tareas y exámenes", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const subjects = config.subjects;
  const subjectRange = `'Materias'!$A$7:$A$${6 + subjects.length + 5}`;

  // Horario semanal de estudio (bloques de una hora)
  addSheetHeader(week, {
    title: "Horario semanal de estudio",
    subtitle: "Elige la materia que estudiarás en cada bloque de una hora.",
    theme,
    width: 8,
  });
  week.getColumn(1).width = 12;
  ["Hora", ...DAYS].forEach((h, i) => {
    const c = week.getCell(4, i + 1);
    c.value = h;
    styleHeader(c, theme);
    if (i > 0) week.getColumn(i + 1).width = 16;
  });
  const hours = Array.from(
    { length: config.lastHour - config.firstHour },
    (_, i) => config.firstHour + i,
  );
  hours.forEach((h, i) => {
    const r = 5 + i;
    const hc = week.getCell(r, 1);
    hc.value = hourLabel(h);
    styleCalc(hc, theme);
    DAYS.forEach((_, d) => {
      const c = week.getCell(r, 2 + d);
      styleInput(c, theme, "#FFFFFF");
      c.alignment = { horizontal: "center", vertical: "middle" };
      if (ex && d < 5 && (h === 15 || h === 16 || h === 19))
        c.value = subjects[(d + h) % subjects.length] ?? null;
    });
  });
  const gridLast = 4 + hours.length;
  const grid = `B5:H${gridLast}`;
  const gridAbs = `'Horario'!$B$5:$H$${gridLast}`;
  listFromRange(week, grid, subjectRange);
  subjects
    .slice(0, COLORS.length)
    .forEach((_, i) =>
      highlightWhen(
        week,
        grid,
        `AND(B5<>"",B5='Materias'!$A$${7 + i})`,
        { fill: COLORS[i]! },
        i + 1,
      ),
    );

  // Sesiones de estudio
  addSheetHeader(log, {
    title: "Sesiones de estudio",
    subtitle: "Anota lo que estudiaste y cuánto tiempo.",
    theme,
    width: 6,
  });
  const lt = addTable(log, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "subject",
        header: "Materia",
        kind: "list",
        width: 22,
        list: { source: subjectRange },
      },
      { key: "topic", header: "Tema", kind: "text", width: 30 },
      { key: "minutes", header: "Minutos", kind: "integer", width: 10, total: "sum" },
      {
        key: "level",
        header: "Comprensión",
        kind: "list",
        width: 13,
        list: ["Alta", "Media", "Baja"],
        align: "center",
      },
      { key: "note", header: "Pendiente de repasar", kind: "text", width: 30 },
    ],
    rows: config.sessions,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(0),
            subject: subjects[0],
            topic: "Ecuaciones de segundo grado",
            minutes: 60,
            level: "Media",
            note: "Fórmula general",
          },
          {
            date: fromToday(0),
            subject: subjects[1] ?? subjects[0],
            topic: "Ortografía: acentuación",
            minutes: 45,
            level: "Alta",
          },
          {
            date: fromToday(-10),
            subject: subjects[0],
            topic: "Factorización",
            minutes: 90,
            level: "Baja",
          },
        ]
      : undefined,
  });
  highlightWhen(
    log,
    `E${lt.firstRow}:E${lt.lastRow}`,
    `E${lt.firstRow}="Baja"`,
    { fill: theme.dangerSoft },
    1,
  );
  const L = (k: string) => lt.sheetRange(k);

  // Materias: metas de la semana
  addSheetHeader(subj, {
    title,
    subtitle: "Meta de horas por semana contra lo planificado y lo estudiado.",
    theme,
    width: 7,
  });
  const wk = addFields(subj, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "monday",
        label: "Semana que inicia el lunes",
        kind: "calc",
        resultKind: "date",
        formula: () => `TODAY()-WEEKDAY(TODAY(),2)+1`,
      },
      {
        key: "sunday",
        label: "Hasta el domingo",
        kind: "calc",
        resultKind: "date",
        formula: (c) => `${c("monday")}+6`,
      },
    ],
    theme,
    ctx,
  });
  const MON = wk.cell("monday");
  const SUN = wk.cell("sunday");
  const thisWeek = `${L("date")},">="&${MON},${L("date")},"<="&${SUN}`;
  const st = addTable(subj, {
    startRow: 6,
    columns: [
      { key: "subject", header: "Materia", kind: "text", width: 24 },
      { key: "goal", header: "Meta (horas por semana)", kind: "number", width: 12, total: "sum" },
      {
        key: "planned",
        header: "Planificadas en el horario",
        kind: "formula",
        resultKind: "integer",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("subject")}="","",COUNTIF(${gridAbs},${r.c("subject")}))`,
      },
      {
        key: "done",
        header: "Estudiadas esta semana",
        kind: "formula",
        resultKind: "number",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("subject")}="","",SUMIFS(${L("minutes")},${L("subject")},${r.c("subject")},${thisWeek})/60)`,
      },
      {
        key: "pct",
        header: "Avance de la meta",
        kind: "formula",
        resultKind: "percent",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("subject")}="",N(${r.c("goal")})=0),"",${r.c("done")}/${r.c("goal")})`,
      },
      {
        key: "total",
        header: "Horas en total",
        kind: "formula",
        resultKind: "number",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("subject")}="","",SUMIFS(${L("minutes")},${L("subject")},${r.c("subject")})/60)`,
      },
      {
        key: "pending",
        header: "Pendientes",
        kind: "formula",
        resultKind: "integer",
        width: 11,
        formula: (r) =>
          `IF(${r.c("subject")}="","",COUNTIFS('Tareas y exámenes'!$B$5:$B$304,${r.c("subject")},'Tareas y exámenes'!$F$5:$F$304,"<>Entregado"))`,
      },
    ],
    rows: subjects.length + 5,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 32,
    example: subjects.map((subject, i) => ({ subject, goal: i < 2 ? 4 : 3 })),
  });
  subjects
    .slice(0, COLORS.length)
    .forEach((_, i) => (subj.getCell(st.firstRow + i, 1).fill = solidFill(COLORS[i]!)));
  const pc = st.letter("pct");
  highlightWhen(
    subj,
    `${pc}${st.firstRow}:${pc}${st.lastRow}`,
    `AND(ISNUMBER(${pc}${st.firstRow}),${pc}${st.firstRow}>=1)`,
    { fill: theme.okSoft, bold: true },
    1,
  );

  // Tareas y exámenes
  addSheetHeader(todo, {
    title: "Tareas, proyectos y exámenes",
    subtitle: "Los que vencen en 3 días o menos se marcan en amarillo y los atrasados en rojo.",
    theme,
    width: 7,
  });
  const tt = addTable(todo, {
    startRow: 4,
    columns: [
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 12,
        list: ["Examen", "Tarea", "Proyecto", "Exposición", "Lectura"],
      },
      {
        key: "subject",
        header: "Materia",
        kind: "list",
        width: 22,
        list: { source: subjectRange },
      },
      { key: "detail", header: "Descripción", kind: "text", width: 32 },
      { key: "due", header: "Fecha de entrega", kind: "date", width: 13 },
      {
        key: "left",
        header: "Días restantes",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        allowNegative: true,
        formula: (r) =>
          `IF(OR(${r.c("due")}="",${r.c("status")}="Entregado"),"",${r.c("due")}-TODAY())`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 13,
        list: ["Pendiente", "En proceso", "Entregado"],
        align: "center",
      },
      { key: "grade", header: "Nota obtenida", kind: "number", width: 10 },
    ],
    rows: 300,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            type: "Examen",
            subject: subjects[0],
            detail: "Primer parcial",
            due: fromToday(2),
            status: "En proceso",
          },
          {
            type: "Tarea",
            subject: subjects[1] ?? subjects[0],
            detail: "Ensayo de 2 páginas",
            due: fromToday(-1),
            status: "Pendiente",
          },
          {
            type: "Proyecto",
            subject: subjects[2] ?? subjects[0],
            detail: "Maqueta del átomo",
            due: fromToday(12),
            status: "Pendiente",
          },
          {
            type: "Tarea",
            subject: subjects[0],
            detail: "Guía de ejercicios",
            due: fromToday(-5),
            status: "Entregado",
            grade: 90,
          },
        ]
      : undefined,
  });
  if (tt.firstRow !== 5 || tt.lastRow !== 304) throw new Error("Rango de tareas inesperado");
  const lc = tt.letter("left");
  const all = `A${tt.firstRow}:${tt.letter("grade")}${tt.lastRow}`;
  highlightWhen(
    todo,
    all,
    `AND(ISNUMBER($${lc}${tt.firstRow}),$${lc}${tt.firstRow}<0)`,
    { fill: theme.dangerSoft },
    1,
  );
  highlightWhen(
    todo,
    all,
    `AND(ISNUMBER($${lc}${tt.firstRow}),$${lc}${tt.firstRow}<=3)`,
    { fill: "#FFF2CC" },
    2,
  );
  addFields(subj, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    labelSpan: 1,
    fields: [
      {
        key: "week",
        label: "Horas estudiadas esta semana",
        kind: "calc",
        resultKind: "number",
        emphasis: true,
        formula: () => st.total("done"),
      },
      {
        key: "late",
        label: "Entregas atrasadas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${tt.sheetRange("left")},"<0")`,
      },
    ],
    theme,
    ctx,
  });

  for (const w of [subj, week, log, todo]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Planificador de estudio",
    description: "Organiza tu semana, cumple tus metas de estudio y no se te pase ninguna entrega.",
    steps: [
      "En Materias escribe cuántas horas por semana quieres estudiar cada materia.",
      "En Horario elige la materia de cada bloque de una hora; cada materia tiene su color.",
      "Después de estudiar anota la sesión en Sesiones con el tema y los minutos.",
      "En Tareas y exámenes anota cada entrega; los días restantes y las alertas se calculan solos.",
    ],
    tips: [
      "Repasa primero los temas con comprensión Baja.",
      "La semana se calcula de lunes a domingo según la fecha de hoy.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
