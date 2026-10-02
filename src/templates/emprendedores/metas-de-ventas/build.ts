import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { lighten, makeTheme } from "@/lib/excel/styles";
import { cellsOfRange } from "@/lib/excel/summary";
import { addTable, type ColumnDef, type TableRef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { MetasConfig } from "./form";

export const build: TemplateBuild<MetasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith(`Metas de ventas ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const now = addSheet(wb, "Este mes", { tabColor: theme.primary });
  const goals = addSheet(wb, "Metas", {
    freezeRows: 4,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const sales = addSheet(wb, "Ventas", { freezeRows: 4, tabColor: theme.primary });
  const comp = addSheet(wb, "Cumplimiento", {
    freezeRows: 6,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const lists = addListsSheet(wb, theme, [
    { key: "sellers", title: "Vendedores", values: config.sellers, spare: 5 },
  ]);
  const ex = config.example;
  const sellerCells = cellsOfRange(lists.source("sellers"));
  const rows = sellerCells.length;
  const goal = config.monthlyGoal;
  const nameCol: ColumnDef = {
    key: "name",
    header: "Vendedor",
    kind: "formula",
    width: 22,
    formula: (r) => `IF(${sellerCells[r.index]}="","",${sellerCells[r.index]})`,
  };

  // Ventas
  addSheetHeader(sales, {
    title: "Registro de ventas",
    subtitle: "Cada venta con su fecha, vendedor y monto.",
    theme,
    width: 5,
  });
  const vt = addTable(sales, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "seller",
        header: "Vendedor",
        kind: "list",
        width: 20,
        list: { source: lists.source("sellers") },
      },
      { key: "client", header: "Cliente", kind: "text", width: 24 },
      { key: "detail", header: "Detalle o factura", kind: "text", width: 24 },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 10),
            seller: config.sellers[0],
            client: "Pulpería La Bendición",
            amount: 30000,
          },
          {
            date: exampleDate(y, 1, 25),
            seller: config.sellers[0],
            client: "Súper El Ahorro",
            amount: 25000,
          },
          {
            date: exampleDate(y, 1, 15),
            seller: config.sellers[1] ?? config.sellers[0],
            client: "Comercial Díaz",
            amount: 35000,
          },
          {
            date: exampleDate(y, 2, 8),
            seller: config.sellers[0],
            client: "Pulpería La Bendición",
            amount: 42000,
          },
        ]
      : undefined,
  });
  const V = (k: string) => vt.sheetRange(k);

  // Metas
  addSheetHeader(goals, {
    title: `Metas ${y}`,
    subtitle: "Escribe la meta de cada mes; la inicial es la misma para todos.",
    theme,
    width: 14,
  });
  const gt = addTable(goals, {
    startRow: 4,
    columns: [
      nameCol,
      ...SHORT_MONTHS.map((m, i): ColumnDef => ({
        key: `m${i}`,
        header: m,
        kind: "currency",
        width: 11,
        total: "sum",
        fill: goal,
      })),
      {
        key: "total",
        header: "Meta del año",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",SUM(${r.c("m0")}:${r.c("m11")}))`,
      },
    ],
    rows,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  // Las filas libres no llevan meta inicial
  for (let i = config.sellers.length; i < rows; i++)
    for (let m = 0; m < 12; m++) goals.getCell(gt.firstRow + i, gt.colNumber(`m${m}`)).value = null;

  // Cumplimiento
  addSheetHeader(comp, {
    title: `Cumplimiento ${y}`,
    subtitle:
      "Ventas reales y porcentaje de la meta. Verde: cumplida; amarillo: cerca; rojo: lejos.",
    theme,
    width: 14,
  });
  const cf = addFields(comp, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      { key: "warn", label: "Amarillo desde", kind: "percent", value: 0.8 },
    ],
    theme,
    ctx,
  });
  addFields(comp, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [{ key: "ok", label: "Verde desde", kind: "percent", value: 1 }],
    theme,
    ctx,
  });
  const Y = cf.cell("year");
  const WARN = cf.cell("warn");
  const OK = "$E$3";
  const realOf = (name: string, m: number) =>
    `SUMIFS(${V("amount")},${V("seller")},${name},${V("date")},">="&DATE(${Y},${m + 1},1),${V("date")},"<="&EOMONTH(DATE(${Y},${m + 1},1),0))`;
  const rt = addTable(comp, {
    startRow: 6,
    columns: [
      { ...nameCol, header: "Ventas reales" },
      ...SHORT_MONTHS.map((m, i): ColumnDef => ({
        key: `m${i}`,
        header: m,
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${realOf(r.c("name"), i)})`,
      })),
      {
        key: "total",
        header: "Total del año",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",SUM(${r.c("m0")}:${r.c("m11")}))`,
      },
    ],
    rows,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  const goalCell = (t: TableRef, key: string, index: number) =>
    `'Metas'!${t.cell(key, t.firstRow + index)}`;
  const realCell = (key: string, index: number) => rt.cell(key, rt.firstRow + index);
  const pctStart = rt.totalRow! + 3;
  const pt = addTable(comp, {
    startRow: pctStart,
    columns: [
      { ...nameCol, header: "% de la meta" },
      ...SHORT_MONTHS.map((m, i): ColumnDef => ({
        key: `m${i}`,
        header: m,
        kind: "formula",
        resultKind: "percent",
        width: 11,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${goalCell(gt, `m${i}`, r.index)})=0),"",${realCell(`m${i}`, r.index)}/${goalCell(gt, `m${i}`, r.index)})`,
      })),
      {
        key: "total",
        header: "Año",
        kind: "formula",
        resultKind: "percent",
        width: 14,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${goalCell(gt, "total", r.index)})=0),"",${realCell("total", r.index)}/${goalCell(gt, "total", r.index)})`,
      },
    ],
    rows,
    theme,
    ctx,
  });
  const grid = `B${pt.firstRow}:${pt.letter("total")}${pt.lastRow}`;
  const tl = `B${pt.firstRow}`;
  highlightWhen(
    comp,
    grid,
    `AND(ISNUMBER(${tl}),${tl}>=${OK})`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    comp,
    grid,
    `AND(ISNUMBER(${tl}),${tl}>=${WARN})`,
    { fill: lighten(theme.highlight, 0.6) },
    2,
  );
  highlightWhen(comp, grid, `ISNUMBER(${tl})`, { fill: theme.dangerSoft }, 3);

  // Este mes
  addSheetHeader(now, {
    title: titleWith("Mes en curso", config.businessName),
    subtitle: "Avance de la meta, proyección al cierre y lo que falta por día.",
    theme,
    width: 7,
  });
  const nf = addFields(now, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "date", label: "Fecha de corte", kind: "date" },
      {
        key: "month",
        label: "Mes",
        kind: "calc",
        resultKind: "integer",
        formula: (c) => `MONTH(${c("date")})`,
      },
      {
        key: "days",
        label: "Días del mes",
        kind: "calc",
        resultKind: "integer",
        formula: (c) => `DAY(EOMONTH(${c("date")},0))`,
      },
      {
        key: "elapsed",
        label: "Avance del mes",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => `DAY(${c("date")})/${c("days")}`,
      },
    ],
    theme,
    ctx,
  });
  now.getCell(nf.cell("date").replace(/\$/g, "")).value = { formula: "TODAY()" };
  now.getColumn(1).width = 22;
  const D = nf.cell("date");
  const MONTH = nf.cell("month");
  const ELAPSED = nf.cell("elapsed");
  const DAYS = nf.cell("days");
  const monthGoal = (index: number) =>
    `INDEX('Metas'!${gt.cell("m0", gt.firstRow + index, true)}:${gt.cell("m11", gt.firstRow + index, true)},1,${MONTH})`;
  const monthReal = (name: string) =>
    `SUMIFS(${V("amount")},${V("seller")},${name},${V("date")},">="&DATE(YEAR(${D}),${MONTH},1),${V("date")},"<="&${D})`;
  const nt = addTable(now, {
    startRow: 9,
    columns: [
      nameCol,
      {
        key: "goal",
        header: "Meta del mes",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",N(${monthGoal(r.index)}))`,
      },
      {
        key: "real",
        header: "Vendido a la fecha",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${monthReal(r.c("name"))})`,
      },
      {
        key: "pct",
        header: "% de la meta",
        kind: "formula",
        resultKind: "percent",
        width: 11,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("goal")})=0),"",${r.c("real")}/${r.c("goal")})`,
      },
      {
        key: "projection",
        header: "Proyección al cierre",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(OR(${r.c("name")}="",${ELAPSED}=0),"",${r.c("real")}/${ELAPSED})`,
      },
      {
        key: "missing",
        header: "Falta vender",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",MAX(0,${r.c("goal")}-${r.c("real")}))`,
      },
      {
        key: "perDay",
        header: "Falta por día",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(${DAYS}-DAY(${D})<=0,${r.c("missing")},${r.c("missing")}/(${DAYS}-DAY(${D}))))`,
      },
    ],
    rows,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  const pc = nt.letter("pct");
  highlightWhen(
    now,
    `${pc}${nt.firstRow}:${pc}${nt.lastRow}`,
    `AND(ISNUMBER(${pc}${nt.firstRow}),${pc}${nt.firstRow}>=${ELAPSED})`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    now,
    `${pc}${nt.firstRow}:${pc}${nt.lastRow}`,
    `ISNUMBER(${pc}${nt.firstRow})`,
    { fill: theme.dangerSoft },
    2,
  );
  addFields(now, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "pct",
        label: "Cumplimiento del equipo",
        kind: "calc",
        resultKind: "percent",
        emphasis: true,
        formula: () => `IF(${nt.total("goal")}=0,"",${nt.total("real")}/${nt.total("goal")})`,
      },
      {
        key: "proj",
        label: "Proyección del equipo",
        kind: "calc",
        resultKind: "currency",
        formula: () => nt.total("projection"),
      },
      {
        key: "ytd",
        label: "Vendido en el año",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `SUMIFS(${V("amount")},${V("date")},">="&DATE(YEAR(${D}),1,1),${V("date")},"<="&${D})`,
      },
    ],
    theme,
    ctx,
  });

  for (const w of [now, goals, sales, comp]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Metas de ventas",
    description: "Fija metas claras y sabe cada día si tu equipo va a cumplirlas.",
    steps: [
      "En Metas revisa la meta de cada mes para cada vendedor, sucursal o canal.",
      "En Ventas registra cada venta con su fecha, vendedor y monto.",
      "Cumplimiento muestra lo vendido y el porcentaje de la meta mes por mes con semáforo.",
      "Este mes compara el avance de la meta con el avance de los días y proyecta el cierre.",
    ],
    tips: [
      "Si el % de la meta va por debajo del avance del mes, se pinta en rojo: hay que acelerar.",
      "Puedes cambiar los porcentajes del semáforo en Cumplimiento.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
