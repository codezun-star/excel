import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { lighten, makeTheme } from "@/lib/excel/styles";
import { MONTHS_ES } from "@/lib/excel/summary";
import { addTable, type ColumnDef, type TableRef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { AsistenciaConfig } from "./form";

const DAY_INITIALS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
const CODES = ["P", "A", "T", "J"];

/** Días hábiles del mes (lunes a viernes, o a sábado). */
function schoolDays(
  year: number,
  month: number,
  saturdays: boolean,
): { day: number; dow: number }[] {
  const out: { day: number; dow: number }[] = [];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= last; d++) {
    const dow = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    if (dow === 0 || (dow === 6 && !saturdays)) continue;
    out.push({ day: d, dow });
  }
  return out;
}

export const build: TemplateBuild<AsistenciaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const subtitle = [config.group, config.teacher].filter(Boolean).join(" · ");
  const title = titleWith(`Asistencia ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const roster = addSheet(wb, "Alumnos", { freezeRows: 4, tabColor: theme.primary });
  const months = Array.from(
    { length: config.lastMonth - config.firstMonth + 1 },
    (_, i) => config.firstMonth + i,
  );
  const ex = config.example;
  const names = [
    "Ana Sofía Martínez",
    "Luis Fernando Reyes",
    "María José Hernández",
    "Carlos Eduardo López",
    "Daniela Alejandra Cruz",
  ];

  addSheetHeader(roster, {
    title,
    subtitle: subtitle || "Escribe los alumnos una sola vez: aparecen en todas las hojas.",
    theme,
    width: 6,
  });
  const top = addFields(roster, {
    startRow: 3,
    labelCol: 5,
    valueCol: 6,
    fields: [
      { key: "min", label: "Asistencia mínima", kind: "percent", value: config.minimum / 100 },
    ],
    theme,
    ctx,
  });
  const MIN = top.ref("min");
  const rt = addTable(roster, {
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
      { key: "name", header: "Nombre del alumno", kind: "text", width: 32 },
      { key: "id", header: "Identidad o código", kind: "text", width: 18 },
      { key: "sex", header: "Sexo", kind: "list", width: 7, list: ["F", "M"], align: "center" },
      { key: "guardian", header: "Encargado", kind: "text", width: 24 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
    ],
    rows: config.students,
    theme,
    ctx,
    example: ex
      ? names.map((name, i) => ({
          name,
          sex: i % 2 === 0 ? "F" : "M",
          guardian: "Padre o madre",
          phone: `9${i}00-000${i}`,
        }))
      : undefined,
  });

  const monthTables: { name: string; table: TableRef }[] = [];
  for (const m of months) {
    const name = MONTHS_ES[m - 1]!;
    const ws = addSheet(wb, name, {
      freezeRows: 5,
      freezeCols: 2,
      landscape: true,
      tabColor: theme.primary,
    });
    const days = schoolDays(y, m, config.saturdays);
    addSheetHeader(ws, {
      title: `Asistencia de ${name.toLowerCase()} ${y}`,
      subtitle: `${subtitle ? `${subtitle} · ` : ""}P presente · A ausente · T tarde · J justificada`,
      theme,
      width: days.length + 8,
    });
    const dayCols: ColumnDef[] = days.map(({ day, dow }) => ({
      key: `d${day}`,
      header: `${DAY_INITIALS[dow]}\n${day}`,
      kind: "list",
      list: CODES,
      width: 4.2,
      align: "center",
      total: (range) => `IF(COUNTA(${range})=0,"",COUNTIF(${range},"P")+COUNTIF(${range},"T"))`,
    }));
    const first = `d${days[0]!.day}`;
    const last = `d${days[days.length - 1]!.day}`;
    const span = (r: { c: (k: string) => string }) => `${r.c(first)}:${r.c(last)}`;
    const table = addTable(ws, {
      startRow: 5,
      columns: [
        {
          key: "n",
          header: "N.º",
          kind: "formula",
          resultKind: "integer",
          width: 5,
          align: "center",
          formula: (r) =>
            `IF('Alumnos'!${rt.cell("name", rt.firstRow + r.index)}="","",${r.index + 1})`,
        },
        {
          key: "name",
          header: "Alumno",
          kind: "formula",
          width: 28,
          formula: (r) =>
            `IF('Alumnos'!${rt.cell("name", rt.firstRow + r.index)}="","",'Alumnos'!${rt.cell("name", rt.firstRow + r.index)})`,
        },
        ...dayCols,
        {
          key: "present",
          header: "Asistió",
          kind: "formula",
          resultKind: "integer",
          width: 8,
          total: "sum",
          formula: (r) =>
            `IF(${r.c("name")}="","",COUNTIF(${span(r)},"P")+COUNTIF(${span(r)},"T"))`,
        },
        {
          key: "late",
          header: "Tardanzas",
          kind: "formula",
          resultKind: "integer",
          width: 9,
          total: "sum",
          formula: (r) => `IF(${r.c("name")}="","",COUNTIF(${span(r)},"T"))`,
        },
        {
          key: "absent",
          header: "Ausencias",
          kind: "formula",
          resultKind: "integer",
          width: 9,
          total: "sum",
          formula: (r) => `IF(${r.c("name")}="","",COUNTIF(${span(r)},"A"))`,
        },
        {
          key: "excused",
          header: "Justificadas",
          kind: "formula",
          resultKind: "integer",
          width: 10,
          total: "sum",
          formula: (r) => `IF(${r.c("name")}="","",COUNTIF(${span(r)},"J"))`,
        },
        {
          key: "marked",
          header: "Días registrados",
          kind: "formula",
          resultKind: "integer",
          width: 10,
          formula: (r) =>
            `IF(${r.c("name")}="","",${r.c("present")}+${r.c("absent")}+${r.c("excused")})`,
        },
        {
          key: "pct",
          header: "% asistencia",
          kind: "formula",
          resultKind: "percent",
          width: 10,
          formula: (r) =>
            `IF(OR(${r.c("name")}="",N(${r.c("marked")})=0),"",${r.c("present")}/${r.c("marked")})`,
        },
      ],
      rows: config.students,
      theme,
      ctx,
      totals: { label: "Presentes del día" },
      headerHeight: 32,
      example:
        ex && m === config.firstMonth
          ? names.map((_, i) =>
              Object.fromEntries(
                days
                  .slice(0, 10)
                  .map(({ day }, k) => [
                    `d${day}`,
                    i === 1 && k % 3 === 0
                      ? "A"
                      : i === 3 && k === 2
                        ? "T"
                        : i === 3 && k === 5
                          ? "J"
                          : "P",
                  ]),
              ),
            )
          : undefined,
    });
    const g1 = table.letter(first);
    const g2 = table.letter(last);
    const grid = `${g1}${table.firstRow}:${g2}${table.lastRow}`;
    const tl = `${g1}${table.firstRow}`;
    highlightWhen(ws, grid, `${tl}="A"`, { fill: theme.dangerSoft, bold: true }, 1);
    highlightWhen(ws, grid, `${tl}="T"`, { fill: lighten(theme.highlight, 0.6) }, 2);
    highlightWhen(ws, grid, `${tl}="J"`, { fill: "#DCEBF7" }, 3);
    highlightWhen(ws, grid, `${tl}="P"`, { fill: theme.okSoft }, 4);
    const pc = table.letter("pct");
    highlightWhen(
      ws,
      `${pc}${table.firstRow}:${pc}${table.lastRow}`,
      `AND(ISNUMBER(${pc}${table.firstRow}),${pc}${table.firstRow}<${MIN})`,
      { color: theme.danger, bold: true },
      5,
    );
    monthTables.push({ name, table });
    await protectSheet(ws);
  }

  const sum = addSheet(wb, "Resumen", {
    freezeRows: 4,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  addSheetHeader(sum, {
    title: `Resumen de asistencia ${y}`,
    subtitle: subtitle || "Porcentaje de asistencia por alumno y por mes.",
    theme,
    width: months.length + 6,
  });
  const cellOf = (t: TableRef, key: string, index: number) =>
    `'${t.ws.name}'!${t.cell(key, t.firstRow + index)}`;
  const st = addTable(sum, {
    startRow: 4,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 5,
        align: "center",
        formula: (r) =>
          `IF('Alumnos'!${rt.cell("name", rt.firstRow + r.index)}="","",${r.index + 1})`,
      },
      {
        key: "name",
        header: "Alumno",
        kind: "formula",
        width: 28,
        formula: (r) =>
          `IF('Alumnos'!${rt.cell("name", rt.firstRow + r.index)}="","",'Alumnos'!${rt.cell("name", rt.firstRow + r.index)})`,
      },
      ...monthTables.map(({ name, table }): ColumnDef => ({
        key: `m${name}`,
        header: name.slice(0, 3),
        kind: "formula",
        resultKind: "percent",
        width: 8,
        formula: (r) => `IF(${r.c("name")}="","",${cellOf(table, "pct", r.index)})`,
      })),
      {
        key: "absent",
        header: "Ausencias del año",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",${monthTables.map(({ table }) => `N(${cellOf(table, "absent", r.index)})`).join("+")})`,
      },
      {
        key: "late",
        header: "Tardanzas del año",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",${monthTables.map(({ table }) => `N(${cellOf(table, "late", r.index)})`).join("+")})`,
      },
      {
        key: "pct",
        header: "% del año",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) => {
          const present = monthTables
            .map(({ table }) => `N(${cellOf(table, "present", r.index)})`)
            .join("+");
          const marked = monthTables
            .map(({ table }) => `N(${cellOf(table, "marked", r.index)})`)
            .join("+");
          return `IF(${r.c("name")}="","",IF((${marked})=0,"",(${present})/(${marked})))`;
        },
      },
      {
        key: "status",
        header: "Situación",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("name")}="",${r.c("pct")}=""),"",IF(${r.c("pct")}<${MIN},"En riesgo","Bien"))`,
      },
    ],
    rows: config.students,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 30,
  });
  const sc = st.letter("status");
  highlightWhen(
    sum,
    `A${st.firstRow}:${sc}${st.lastRow}`,
    `$${sc}${st.firstRow}="En riesgo"`,
    { fill: theme.dangerSoft },
    1,
  );
  addFields(sum, {
    startRow: 3,
    labelCol: months.length + 4,
    valueCol: months.length + 6,
    labelSpan: 2,
    fields: [
      {
        key: "risk",
        label: "Alumnos en riesgo",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: () => `COUNTIF(${st.range("status")},"En riesgo")`,
      },
    ],
    theme,
    ctx,
  });

  await protectSheet(roster);
  await protectSheet(sum);

  addInstructionsSheet(wb, {
    title: "Asistencia escolar",
    description:
      "Pasa lista cada día y conoce al instante el porcentaje de asistencia de cada alumno.",
    steps: [
      "En Alumnos escribe la lista del grado una sola vez; aparece en todas las hojas de los meses.",
      "Cada día elige P (presente), A (ausente), T (tarde) o J (justificada) en la columna de la fecha.",
      "Los feriados y días sin clases déjalos vacíos: no cuentan para el porcentaje.",
      "El Resumen junta todos los meses y marca en rojo a los alumnos bajo la asistencia mínima.",
    ],
    tips: [
      "Las tardanzas cuentan como asistencia; las justificadas cuentan como ausencia, pero se muestran aparte.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 1);
  return wb;
};
