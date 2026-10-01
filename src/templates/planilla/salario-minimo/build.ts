import { addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { SalarioMinimoConfig } from "./form";

export const build: TemplateBuild<SalarioMinimoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const mw = ctx.labor.minimumWage;
  const wb = createWorkbook({
    title: titleWith("Salario mínimo", config.businessName),
    ctx,
    options,
  });
  const checker = addSheet(wb, "Verificador", { freezeRows: 4, tabColor: theme.primary });
  const tableWs = addSheet(wb, "Tabla", { tabColor: theme.primary, landscape: true });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Bases",
        rows: [
          {
            key: "days:month",
            label: "Días por mes",
            value: ctx.labor.dayBasis / 12,
            kind: "integer",
          },
          {
            key: "hours:day",
            label: "Horas de la jornada diurna",
            value: ctx.labor.workdays.day.hoursPerDay,
            kind: "integer",
          },
          {
            key: "average",
            label: "Salario mínimo promedio (uso fiscal)",
            value: mw.averageMonthly,
            kind: "currency",
          },
        ],
      },
    ],
    tables: [
      {
        key: "sizes",
        title: "Tamaños de empresa (número de trabajadores)",
        columns: [{ header: "Tamaño", kind: "text" }],
        rows: mw.companySizes.map((s) => [s]),
      },
    ],
  });

  // --- Tabla oficial ------------------------------------------------------
  addSheetHeader(tableWs, {
    title: `Salario mínimo mensual — ${ctx.name}`,
    subtitle: `${mw.agreement} · vigente desde ${mw.effectiveFrom}. Las celdas vacías están pendientes de verificar con la tabla oficial.`,
    theme,
    width: 1 + mw.companySizes.length * 3,
  });
  const sizeCols = mw.companySizes.flatMap((size, i) => [
    { key: `m${i}`, header: `${size}\nMensual`, kind: "currency" as const, width: 14 },
    {
      key: `d${i}`,
      header: `${size}\nDiario`,
      kind: "formula" as const,
      resultKind: "currency" as const,
      width: 12,
      formula: (r: { c: (k: string) => string }) =>
        `IF(${r.c(`m${i}`)}="","",${r.c(`m${i}`)}/${params.ref("days:month")})`,
    },
    {
      key: `h${i}`,
      header: `${size}\nPor hora`,
      kind: "formula" as const,
      resultKind: "currency" as const,
      width: 11,
      formula: (r: { c: (k: string) => string }) =>
        `IF(${r.c(`d${i}`)}="","",${r.c(`d${i}`)}/${params.ref("hours:day")})`,
    },
  ]);
  const wageTable = addTable(tableWs, {
    startRow: 4,
    columns: [
      { key: "sector", header: "Rama de actividad económica", kind: "text", width: 44, wrap: true },
      ...sizeCols,
    ],
    rows: mw.table.length,
    theme,
    ctx,
    headerHeight: 44,
    example: mw.table.map((row) => ({
      sector: row.sector,
      ...Object.fromEntries(row.monthly.map((m, i) => [`m${i}`, m.amount])),
    })),
  });

  // --- Verificador ----------------------------------------------------------
  addSheetHeader(checker, {
    title: titleWith("Verificador de salario mínimo", config.businessName),
    subtitle:
      "Elige la rama y el tamaño de la empresa para comparar el salario de cada empleado con el mínimo.",
    theme,
    width: 7,
  });
  const sectors = wageTable.sheetRange("sector");
  const monthlyCols = mw.companySizes.map((_, i) => wageTable.sheetRange(`m${i}`));
  const lookup = (sector: string, size: string) =>
    `IFERROR(CHOOSE(MATCH(${size},${params.tableColumn("sizes", 0)},0),${monthlyCols
      .map((col) => `INDEX(${col},MATCH(${sector},${sectors},0))`)
      .join(",")}),"")`;
  const table = addTable(checker, {
    startRow: 4,
    columns: [
      { key: "name", header: "Empleado", kind: "text", width: 26 },
      {
        key: "sector",
        header: "Rama de actividad",
        kind: "list",
        width: 34,
        list: { source: sectors },
      },
      {
        key: "size",
        header: "Tamaño de empresa",
        kind: "list",
        width: 14,
        list: { source: params.tableColumn("sizes", 0) },
      },
      { key: "salary", header: "Salario mensual pagado", kind: "currency", width: 16 },
      {
        key: "minimum",
        header: "Salario mínimo",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) =>
          `IF(OR(${r.c("sector")}="",${r.c("size")}=""),"",${lookup(r.c("sector"), r.c("size"))})`,
      },
      {
        key: "diff",
        header: "Diferencia",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        allowNegative: true,
        formula: (r) =>
          `IF(OR(${r.c("salary")}="",${r.c("minimum")}="",${r.c("minimum")}=0),"",${r.c("salary")}-${r.c("minimum")})`,
      },
      {
        key: "status",
        header: "¿Cumple?",
        kind: "formula",
        width: 14,
        align: "center",
        formula: (r) =>
          `IF(${r.c("salary")}="","",IF(OR(${r.c("minimum")}="",${r.c("minimum")}=0),"Por verificar",IF(${r.c("diff")}>=0,"Sí","No")))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    example: config.example
      ? [
          {
            name: "Pedro Gómez",
            sector: mw.table[0]?.sector,
            size: mw.companySizes[0],
            salary: 10_000,
          },
          {
            name: "Lucía Paz",
            sector: mw.table[1]?.sector,
            size: mw.companySizes[1],
            salary: 12_500,
          },
          {
            name: "Mario Ruiz",
            sector: mw.table[3]?.sector,
            size: mw.companySizes[3],
            salary: 19_500,
          },
        ]
      : undefined,
  });
  const st = `${table.letter("status")}${table.firstRow}`;
  const stRange = `${st}:${table.letter("status")}${table.lastRow}`;
  highlightWhen(checker, stRange, `${st}="No"`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  highlightWhen(checker, stRange, `${st}="Sí"`, { fill: theme.okSoft });
  highlightWhen(checker, stRange, `${st}="Por verificar"`, { fill: theme.warningSoft });
  await protectSheet(checker);
  await protectSheet(tableWs);

  addInstructionsSheet(wb, {
    title: "Salario mínimo",
    description:
      "Consulta el salario mínimo vigente por rama de actividad y verifica si tus empleados lo reciben.",
    steps: [
      "Revisa la hoja Tabla con los salarios mínimos mensuales, diarios y por hora.",
      "En la hoja Verificador escribe cada empleado, elige su rama de actividad, el tamaño de la empresa y su salario.",
      "El verificador muestra el mínimo aplicable, la diferencia y si cumple.",
    ],
    tips: [
      "Si una celda de la tabla está vacía, el valor aún no se cargó: complétalo con la tabla oficial de la Secretaría de Trabajo.",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
