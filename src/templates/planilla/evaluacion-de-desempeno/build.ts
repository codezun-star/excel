import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { FMT } from "@/lib/excel/formats";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { colLetter } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { styleHeader, styleInput, styleLabel, styleCalc } from "@/lib/excel/styles";
import { makeTheme } from "@/lib/excel/styles";
import { addTable, type ColumnDef } from "@/lib/excel/table";
import { decimalBetween } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { EvaluacionConfig } from "./form";

const SCALE: [number, string][] = [
  [0, "Deficiente"],
  [2, "Regular"],
  [3, "Bueno"],
  [3.75, "Muy bueno"],
  [4.5, "Excelente"],
];

export const build: TemplateBuild<EvaluacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Evaluación de desempeño", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Evaluación", {
    freezeRows: 9,
    tabColor: theme.primary,
    landscape: true,
  });
  const comps = config.competencies;
  const compKeys = comps.map((_, i) => `c${i}`);
  const weightRow = 8;
  const headerRow = 9;
  const firstComp = 4; // A empleado, B cargo, C evaluador
  const lastComp = firstComp + comps.length - 1;
  const firstL = colLetter(firstComp);
  const lastL = colLetter(lastComp);
  const weights = `$${firstL}$${weightRow}:$${lastL}$${weightRow}`;

  addSheetHeader(ws, {
    title,
    subtitle: `${config.period || "Período"} · Califica cada competencia de 1 (deficiente) a 5 (excelente).`,
    theme,
    width: lastComp + 3,
  });

  // Fila de pesos sobre las columnas de competencias
  const wl = ws.getCell(weightRow, firstComp - 1);
  wl.value = "Peso de cada competencia →";
  styleLabel(wl, theme, false);
  wl.alignment = { horizontal: "right", vertical: "middle" };
  const equal = Math.round((1 / comps.length) * 10000) / 10000;
  comps.forEach((_, i) => {
    const cell = ws.getCell(weightRow, firstComp + i);
    cell.value =
      i === comps.length - 1 ? Math.round((1 - equal * (comps.length - 1)) * 10000) / 10000 : equal;
    cell.numFmt = FMT.percent;
    styleInput(cell, theme);
  });
  decimalBetween(
    ws,
    `${firstL}${weightRow}:${lastL}${weightRow}`,
    0,
    1,
    "Escribe un porcentaje entre 0% y 100%.",
  );
  const sumCell = ws.getCell(weightRow, lastComp + 1);
  sumCell.value = { formula: `SUM(${weights})` };
  sumCell.numFmt = FMT.percent;
  styleCalc(sumCell, theme);
  sumCell.note = "La suma de los pesos debería ser 100 %.";

  const compColumns: ColumnDef[] = comps.map((name, i) => ({
    key: compKeys[i]!,
    header: name,
    kind: "integer",
    width: 13,
    min: 1,
    align: "center",
  }));
  const ex = config.example;
  const sample = (vals: number[]) =>
    Object.fromEntries(compKeys.map((k, i) => [k, vals[i % vals.length]]));
  const table = addTable(ws, {
    startRow: headerRow,
    headerHeight: 42,
    columns: [
      { key: "employee", header: "Empleado", kind: "text", width: 26 },
      { key: "role", header: "Cargo", kind: "text", width: 18 },
      { key: "evaluator", header: "Evaluador", kind: "text", width: 18 },
      ...compColumns.map((c) => ({ ...c, wrap: false })),
      {
        key: "score",
        header: "Puntaje (1 a 5)",
        kind: "formula",
        resultKind: "number",
        width: 12,
        align: "center",
        formula: (r) => {
          const row = `${firstL}${r.row}:${lastL}${r.row}`;
          return `IF(OR(${r.c("employee")}="",COUNT(${row})<${comps.length}),"",ROUND(SUMPRODUCT(${row},${weights})/SUM(${weights}),2))`;
        },
      },
      {
        key: "rating",
        header: "Calificación",
        kind: "formula",
        width: 14,
        align: "center",
        formula: (r) =>
          `IF(${r.c("score")}="","",VLOOKUP(${r.c("score")},$${colLetter(lastComp + 6)}$${headerRow + 1}:$${colLetter(lastComp + 7)}$${headerRow + SCALE.length},2,1))`,
      },
      { key: "comments", header: "Comentarios y metas", kind: "text", width: 34 },
    ],
    rows: config.employees,
    theme,
    ctx,
    example: ex
      ? [
          {
            employee: "Ana López",
            role: "Cajera",
            evaluator: "Gerente",
            ...sample([5, 4, 5, 4, 5, 4]),
          },
          {
            employee: "Carlos Mejía",
            role: "Bodeguero",
            evaluator: "Gerente",
            ...sample([3, 4, 2, 3, 3, 3]),
          },
          {
            employee: "Karla Flores",
            role: "Vendedora",
            evaluator: "Gerente",
            ...sample([4, 5, 4, 4, 5, 3]),
          },
        ]
      : undefined,
  });
  // Escala de 1 a 5 en las competencias
  decimalBetween(
    ws,
    `${firstL}${table.firstRow}:${lastL}${table.lastRow}`,
    1,
    5,
    "Califica de 1 a 5.",
  );

  // Tabla de escala (a la derecha)
  const scaleCol = lastComp + 6;
  const h1 = ws.getCell(headerRow, scaleCol);
  h1.value = "Desde";
  styleHeader(h1, theme);
  const h2 = ws.getCell(headerRow, scaleCol + 1);
  h2.value = "Nivel";
  styleHeader(h2, theme);
  ws.getColumn(scaleCol).width = 9;
  ws.getColumn(scaleCol + 1).width = 14;
  SCALE.forEach(([from, label], i) => {
    const a = ws.getCell(headerRow + 1 + i, scaleCol);
    a.value = from;
    a.numFmt = FMT.number;
    styleInput(a, theme);
    const b = ws.getCell(headerRow + 1 + i, scaleCol + 1);
    b.value = label;
    styleInput(b, theme);
  });

  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "avg",
        label: "Promedio del equipo",
        kind: "calc",
        resultKind: "number",
        emphasis: true,
        formula: () => `IFERROR(ROUND(AVERAGE(${table.range("score")}),2),"")`,
      },
      {
        key: "max",
        label: "Mejor puntaje",
        kind: "calc",
        resultKind: "number",
        formula: () => `IF(COUNT(${table.range("score")})=0,"",MAX(${table.range("score")}))`,
      },
      {
        key: "count",
        label: "Empleados evaluados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNT(${table.range("score")})`,
      },
    ],
    theme,
    ctx,
  });
  const rt = table.letter("rating");
  highlightWhen(
    ws,
    `${rt}${table.firstRow}:${rt}${table.lastRow}`,
    `${rt}${table.firstRow}="Excelente"`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    ws,
    `${rt}${table.firstRow}:${rt}${table.lastRow}`,
    `OR(${rt}${table.firstRow}="Deficiente",${rt}${table.firstRow}="Regular")`,
    { fill: theme.dangerSoft, color: theme.danger },
    2,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Evaluación de desempeño",
    description: "Evalúa a tu equipo por competencias con una escala clara y pesos a tu medida.",
    steps: [
      "Revisa el peso de cada competencia en la fila superior (la suma debería ser 100 %).",
      "Escribe empleado, cargo y evaluador, y califica cada competencia de 1 a 5.",
      "El puntaje ponderado y la calificación se calculan solos cuando todas las competencias tienen nota.",
      "Usa la columna de comentarios para acordar metas de mejora con cada persona.",
    ],
    tips: [
      "Puedes cambiar los límites de la escala (columna «Desde») para hacerla más o menos exigente.",
      "Evalúa con hechos concretos del período y comparte el resultado en una reunión individual.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
