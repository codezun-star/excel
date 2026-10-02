import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { CampanasConfig } from "./form";

export const build: TemplateBuild<CampanasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith("Campañas y resultados", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const camp = addSheet(wb, "Campañas", {
    freezeRows: 6,
    freezeCols: 1,
    tabColor: theme.primary,
    landscape: true,
  });
  const log = addSheet(wb, "Resultados", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "platforms", title: "Plataformas", values: config.platforms, spare: 6 },
    {
      key: "goals",
      title: "Objetivos",
      values: [
        "Mensajes",
        "Ventas",
        "Tráfico",
        "Reconocimiento",
        "Seguidores",
        "Clientes potenciales",
      ],
    },
  ]);
  const ex = config.example;
  const plat = (i: number) => config.platforms[i % config.platforms.length]!;
  const campLast = 6 + 100;
  const campNames = `'Campañas'!$A$7:$A$${campLast}`;

  addSheetHeader(log, {
    title: "Resultados por día o semana",
    subtitle: "Copia los números del administrador de anuncios y las ventas que lograste.",
    theme,
    width: 9,
  });
  const lt = addTable(log, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "campaign", header: "Campaña", kind: "list", width: 28, list: { source: campNames } },
      { key: "spent", header: "Inversión", kind: "currency", width: 12, total: "sum" },
      { key: "impressions", header: "Impresiones", kind: "integer", width: 12, total: "sum" },
      { key: "reach", header: "Alcance", kind: "integer", width: 11, total: "sum" },
      { key: "clicks", header: "Clics", kind: "integer", width: 9, total: "sum" },
      { key: "leads", header: "Mensajes o contactos", kind: "integer", width: 11, total: "sum" },
      { key: "sales", header: "Ventas (cantidad)", kind: "integer", width: 10, total: "sum" },
      { key: "revenue", header: "Ingresos por ventas", kind: "currency", width: 13, total: "sum" },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 30,
    example: ex
      ? [
          {
            date: exampleDate(y, 3, 7),
            campaign: "Promo Día del Padre",
            spent: 1500,
            impressions: 42000,
            reach: 18000,
            clicks: 620,
            leads: 85,
            sales: 14,
            revenue: 16800,
          },
          {
            date: exampleDate(y, 3, 14),
            campaign: "Promo Día del Padre",
            spent: 1500,
            impressions: 39000,
            reach: 16500,
            clicks: 540,
            leads: 70,
            sales: 11,
            revenue: 13200,
          },
          {
            date: exampleDate(y, 3, 10),
            campaign: "Videos de producto",
            spent: 800,
            impressions: 60000,
            reach: 35000,
            clicks: 300,
            leads: 20,
            sales: 2,
            revenue: 2400,
          },
          {
            date: exampleDate(y, 3, 12),
            campaign: "Volanteo colonia",
            spent: 600,
            leads: 6,
            sales: 3,
            revenue: 3000,
          },
        ]
      : undefined,
  });
  const L = (k: string) => lt.sheetRange(k);

  addSheetHeader(camp, {
    title,
    subtitle: "Los resultados se suman desde la hoja Resultados.",
    theme,
    width: 18,
  });
  const top = addFields(camp, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "margin",
        label: "Margen bruto de lo que vendes",
        kind: "percent",
        value: config.margin / 100,
      },
    ],
    theme,
    ctx,
  });
  const MG = top.ref("margin");
  const sumOf = (key: string, name: string) => `SUMIFS(${L(key)},${L("campaign")},${name})`;
  const safeDiv = (a: string, b: string, blank = `""`) => `IF(N(${b})=0,${blank},${a}/${b})`;
  const ct = addTable(camp, {
    startRow: 6,
    columns: [
      { key: "name", header: "Campaña", kind: "text", width: 28 },
      {
        key: "platform",
        header: "Plataforma",
        kind: "list",
        width: 18,
        list: { source: lists.source("platforms") },
      },
      {
        key: "goal",
        header: "Objetivo",
        kind: "list",
        width: 14,
        list: { source: lists.source("goals") },
      },
      { key: "start", header: "Inicio", kind: "date", width: 12 },
      { key: "end", header: "Fin", kind: "date", width: 12 },
      { key: "budget", header: "Presupuesto", kind: "currency", width: 12, total: "sum" },
      {
        key: "spent",
        header: "Invertido",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${sumOf("spent", r.c("name"))})`,
      },
      {
        key: "used",
        header: "% del presupuesto",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) => `IF(${r.c("name")}="","",${safeDiv(r.c("spent"), r.c("budget"))})`,
      },
      {
        key: "clicks",
        header: "Clics",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${sumOf("clicks", r.c("name"))})`,
      },
      {
        key: "ctr",
        header: "CTR",
        kind: "formula",
        resultKind: "percent",
        width: 8,
        formula: (r) =>
          `IF(${r.c("name")}="","",${safeDiv(r.c("clicks"), sumOf("impressions", r.c("name")))})`,
      },
      {
        key: "cpc",
        header: "Costo por clic",
        kind: "formula",
        resultKind: "currency",
        width: 10,
        formula: (r) => `IF(${r.c("name")}="","",${safeDiv(r.c("spent"), r.c("clicks"))})`,
      },
      {
        key: "leads",
        header: "Mensajes o contactos",
        kind: "formula",
        resultKind: "integer",
        width: 11,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${sumOf("leads", r.c("name"))})`,
      },
      {
        key: "cpl",
        header: "Costo por contacto",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) => `IF(${r.c("name")}="","",${safeDiv(r.c("spent"), r.c("leads"))})`,
      },
      {
        key: "sales",
        header: "Ventas",
        kind: "formula",
        resultKind: "integer",
        width: 8,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${sumOf("sales", r.c("name"))})`,
      },
      {
        key: "cpa",
        header: "Costo por venta",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) => `IF(${r.c("name")}="","",${safeDiv(r.c("spent"), r.c("sales"))})`,
      },
      {
        key: "revenue",
        header: "Ingresos",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${sumOf("revenue", r.c("name"))})`,
      },
      {
        key: "roas",
        header: "ROAS (ingresos ÷ inversión)",
        kind: "formula",
        resultKind: "number",
        width: 11,
        formula: (r) => `IF(${r.c("name")}="","",${safeDiv(r.c("revenue"), r.c("spent"))})`,
      },
      {
        key: "profit",
        header: "Ganancia después de publicidad",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("name")}="","",${r.c("revenue")}*${MG}-${r.c("spent")})`,
      },
    ],
    rows: 100,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 34,
    example: ex
      ? [
          {
            name: "Promo Día del Padre",
            platform: plat(0),
            goal: "Mensajes",
            start: exampleDate(y, 3, 1),
            end: exampleDate(y, 3, 20),
            budget: 4000,
          },
          {
            name: "Videos de producto",
            platform: plat(1),
            goal: "Reconocimiento",
            start: exampleDate(y, 3, 5),
            end: exampleDate(y, 3, 25),
            budget: 1500,
          },
          {
            name: "Volanteo colonia",
            platform: plat(4),
            goal: "Ventas",
            start: exampleDate(y, 3, 12),
            end: exampleDate(y, 3, 12),
            budget: 600,
          },
        ]
      : undefined,
  });
  if (ct.lastRow !== campLast) throw new Error("Rango de campañas inesperado");
  const C = (k: string) => ct.sheetRange(k);
  const pc = ct.letter("profit");
  const roas = ct.letter("roas");
  highlightWhen(
    camp,
    `${pc}${ct.firstRow}:${pc}${ct.lastRow}`,
    `AND(ISNUMBER(${pc}${ct.firstRow}),${pc}${ct.firstRow}<0)`,
    { fill: theme.dangerSoft, bold: true },
    1,
  );
  highlightWhen(
    camp,
    `A${ct.firstRow}:A${ct.lastRow}`,
    `AND(ISNUMBER($${roas}${ct.firstRow}),$${roas}${ct.firstRow}=MAX($${roas}$${ct.firstRow}:$${roas}$${ct.lastRow}))`,
    { fill: theme.okSoft, bold: true },
    2,
  );

  addSheetHeader(sum, {
    title: titleWith(`Resumen ${y}`, config.businessName),
    subtitle: "Inversión y resultados por plataforma y por mes.",
    theme,
    width: 6,
  });
  const bp = addCategorySummary(sum, {
    startRow: 4,
    startCol: 1,
    labelHeader: "Plataforma",
    sourceCells: cellsOfRange(lists.source("platforms")),
    values: [
      {
        header: "Invertido",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("spent")},${C("platform")},${k.labelCell}))`,
      },
      {
        header: "Contactos",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("leads")},${C("platform")},${k.labelCell}))`,
      },
      {
        header: "Ventas",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("sales")},${C("platform")},${k.labelCell}))`,
      },
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("revenue")},${C("platform")},${k.labelCell}))`,
      },
      {
        header: "ROAS",
        kind: "number",
        formula: (k) =>
          `IF(${k.labelCell}="","",IF(SUMIFS(${C("spent")},${C("platform")},${k.labelCell})=0,"",SUMIFS(${C("revenue")},${C("platform")},${k.labelCell})/SUMIFS(${C("spent")},${C("platform")},${k.labelCell})))`,
        total: false,
      },
    ],
    theme,
    ctx,
    labelWidth: 22,
  });
  const yf = addFields(sum, {
    startRow: bp.totalRow + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      {
        key: "roas",
        label: "ROAS total",
        kind: "calc",
        resultKind: "number",
        formula: () =>
          `IF(${lt.sheetTotal("spent")}=0,"",${lt.sheetTotal("revenue")}/${lt.sheetTotal("spent")})`,
      },
      {
        key: "cpa",
        label: "Costo por venta promedio",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `IF(${lt.sheetTotal("sales")}=0,"",${lt.sheetTotal("spent")}/${lt.sheetTotal("sales")})`,
      },
      {
        key: "profit",
        label: "Ganancia después de publicidad",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => ct.sheetTotal("profit"),
      },
    ],
    theme,
    ctx,
  });
  const inMonth = (s?: string, e?: string) => `${L("date")},">="&${s},${L("date")},"<="&${e}`;
  addMonthlySummary(sum, {
    startRow: yf.nextRow + 1,
    startCol: 1,
    yearCell: yf.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Invertido",
        kind: "currency",
        formula: (k) => `SUMIFS(${L("spent")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Contactos",
        kind: "integer",
        formula: (k) => `SUMIFS(${L("leads")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Ventas",
        kind: "integer",
        formula: (k) => `SUMIFS(${L("sales")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) => `SUMIFS(${L("revenue")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
    ],
  });

  for (const w of [camp, log, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Campañas y resultados",
    description: "Descubre qué anuncios te traen clientes y cuáles solo gastan dinero.",
    steps: [
      "En Campañas escribe cada campaña con su plataforma, objetivo, fechas y presupuesto.",
      "En Resultados copia cada día o semana la inversión, impresiones, clics y mensajes del administrador de anuncios.",
      "Anota también cuántas ventas lograste y cuánto ingresó por ellas.",
      "Campañas calcula CTR, costo por clic, costo por contacto, costo por venta, ROAS y la ganancia real; la mejor campaña se resalta en verde.",
    ],
    tips: [
      "Si tus anuncios se cobran en dólares, convierte a tu moneda con la tasa del día de la tarjeta.",
      "Un ROAS alto no basta: revisa la ganancia después de publicidad con tu margen real.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
