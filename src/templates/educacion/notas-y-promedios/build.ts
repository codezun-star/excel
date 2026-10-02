import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable, type ColumnDef, type TableRef } from "@/lib/excel/table";
import { decimalBetween } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { NotasConfig } from "./form";

const EXAMPLE_STUDENTS = [
  "Ana Sofía Bonilla",
  "Carlos Eduardo Mejía",
  "Daniela Ramos",
  "Fernando Zelaya",
];
const EXAMPLE_GRADES = [
  [88, 92, 85, 90],
  [65, 70, 58, 72],
  [95, 97, 93, 99],
  [74, 68, 80, 77],
];

export const build: TemplateBuild<NotasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Registro de notas", config.section || config.businessName),
    ctx,
    options,
  });
  const consolidated = addSheet(wb, "Consolidado", {
    freezeRows: 6,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const studentsWs = addSheet(wb, "Alumnos", { freezeRows: 4, tabColor: theme.primary });
  const subtitle = [config.businessName, config.section].filter(Boolean).join(" · ");
  const ex = config.example;

  addSheetHeader(studentsWs, {
    title: "Lista de alumnos",
    subtitle: "Escribe los nombres una sola vez; se copian a todas las asignaturas.",
    theme,
    width: 3,
  });
  const students = addTable(studentsWs, {
    startRow: 4,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 6,
        align: "center",
        formula: (r) => `IF(${r.c("name")}="","",${r.index + 1})`,
      },
      { key: "name", header: "Alumno", kind: "text", width: 34 },
      { key: "id", header: "Identidad o código", kind: "text", width: 18 },
    ],
    rows: config.students,
    theme,
    ctx,
    example: ex ? EXAMPLE_STUDENTS.map((name) => ({ name })) : undefined,
  });
  const studentRef = (i: number) =>
    sheetRef(studentsWs.name, students.cell("name", students.firstRow + i, true));

  const passing = addFields(consolidated, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "min", label: "Nota mínima para aprobar", kind: "number", value: config.passing },
    ],
    theme,
    ctx,
  });
  const MIN = sheetRef(consolidated.name, passing.cell("min"));

  const subjectTables: { name: string; table: TableRef }[] = [];
  config.subjects.forEach((subject, s) => {
    const ws = addSheet(wb, subject, { freezeRows: 6, freezeCols: 2, tabColor: theme.primary });
    addSheetHeader(ws, { title: subject, subtitle, theme, width: 4 + config.periods });
    const periodKeys = Array.from({ length: config.periods }, (_, i) => `p${i}`);
    const columns: ColumnDef[] = [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 6,
        align: "center",
        formula: (r) => `IF(${r.c("name")}="","",${r.index + 1})`,
      },
      {
        key: "name",
        header: "Alumno",
        kind: "formula",
        width: 32,
        formula: (r) => `IF(${studentRef(r.index)}="","",${studentRef(r.index)})`,
      },
      ...periodKeys.map((k, i): ColumnDef => ({
        key: k,
        header: `Parcial ${i + 1}`,
        kind: "number",
        width: 10,
        align: "center",
        min: 0,
      })),
      {
        key: "avg",
        header: "Promedio",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(COUNT(${periodKeys.map((k) => r.c(k)).join(",")})=0,"",ROUND(AVERAGE(${periodKeys.map((k) => r.c(k)).join(",")}),0))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) => `IF(${r.c("avg")}="","",IF(${r.c("avg")}>=${MIN},"Aprobado","Reprobado"))`,
      },
    ];
    const table = addTable(ws, {
      startRow: 6,
      columns,
      rows: config.students,
      theme,
      ctx,
      example: ex
        ? EXAMPLE_GRADES.map((g) =>
            Object.fromEntries(
              periodKeys.map((k, i) => [k, Math.min(100, (g[i % g.length] ?? 70) + s)]),
            ),
          )
        : undefined,
    });
    decimalBetween(
      ws,
      `${table.letter(periodKeys[0]!)}${table.firstRow}:${table.letter(periodKeys[periodKeys.length - 1]!)}${table.lastRow}`,
      0,
      100,
      "Escribe una nota entre 0 y 100.",
    );
    const stats = addFields(ws, {
      startRow: 3,
      labelCol: 2,
      valueCol: 3,
      fields: [
        {
          key: "avg",
          label: "Promedio de la sección",
          kind: "calc",
          resultKind: "number",
          formula: () => `IFERROR(AVERAGE(${table.range("avg")}),"")`,
        },
        {
          key: "ok",
          label: "Aprobados / reprobados",
          kind: "calc",
          formula: () =>
            `COUNTIF(${table.range("status")},"Aprobado")&" / "&COUNTIF(${table.range("status")},"Reprobado")`,
        },
      ],
      theme,
      ctx,
    });
    void stats;
    const st = `$${table.letter("status")}${table.firstRow}`;
    highlightWhen(
      ws,
      `${table.letter("avg")}${table.firstRow}:${table.letter("status")}${table.lastRow}`,
      `${st}="Reprobado"`,
      { fill: theme.dangerSoft, color: theme.danger },
    );
    subjectTables.push({ name: ws.name, table });
  });

  addSheetHeader(consolidated, {
    title: titleWith("Cuadro consolidado", config.section || ""),
    subtitle,
    theme,
    width: 5 + config.subjects.length,
  });
  const table = addTable(consolidated, {
    startRow: 6,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 6,
        align: "center",
        formula: (r) => `IF(${r.c("name")}="","",${r.index + 1})`,
      },
      {
        key: "name",
        header: "Alumno",
        kind: "formula",
        width: 32,
        formula: (r) => `IF(${studentRef(r.index)}="","",${studentRef(r.index)})`,
      },
      ...subjectTables.map((s, i): ColumnDef => ({
        key: `s${i}`,
        header: s.name,
        kind: "formula",
        resultKind: "integer",
        width: 12,
        align: "center",
        formula: (r) =>
          `${sheetRef(s.name, s.table.cell("avg", s.table.firstRow + r.index, true))}`,
      })),
      {
        key: "avg",
        header: "Promedio general",
        kind: "formula",
        resultKind: "number",
        width: 12,
        align: "center",
        formula: (r) => {
          const cells = subjectTables.map((_, i) => r.c(`s${i}`)).join(",");
          return `IF(COUNT(${cells})=0,"",ROUND(AVERAGE(${cells}),1))`;
        },
      },
      {
        key: "failed",
        header: "Asignaturas reprobadas",
        kind: "formula",
        resultKind: "integer",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("avg")}="","",COUNTIF(${r.c("s0")}:${r.c(`s${subjectTables.length - 1}`)},"<"&${MIN}))`,
      },
      {
        key: "rank",
        header: "Posición",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) => `IF(${r.c("avg")}="","",COUNTIF(${r.col("avg")},">"&${r.c("avg")})+1)`,
      },
    ],
    rows: config.students,
    theme,
    ctx,
  });
  const failed = `${table.letter("failed")}${table.firstRow}`;
  highlightWhen(
    consolidated,
    `${failed}:${table.letter("failed")}${table.lastRow}`,
    `AND(${failed}<>"",${failed}>0)`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
  );
  highlightWhen(
    consolidated,
    `${table.letter("rank")}${table.firstRow}:${table.letter("rank")}${table.lastRow}`,
    `AND(${table.letter("rank")}${table.firstRow}<>"",${table.letter("rank")}${table.firstRow}<=3)`,
    { fill: theme.okSoft, bold: true },
  );
  await protectSheet(consolidated);
  for (const s of subjectTables) await protectSheet(s.table.ws);

  addInstructionsSheet(wb, {
    title: "Notas y promedios",
    description:
      "Registra las calificaciones de tu sección y obtén promedios y el cuadro consolidado sin hacer cuentas.",
    steps: [
      "Escribe los nombres de tus alumnos en la hoja Alumnos.",
      "En cada hoja de asignatura escribe la nota de cada parcial (de 0 a 100).",
      "El promedio y el estado (aprobado o reprobado) se calculan con la nota mínima del Consolidado.",
      "La hoja Consolidado reúne los promedios de todas las asignaturas, el promedio general y la posición de cada alumno.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
