import "server-only";

import { addFields, addSheetHeader, type FieldSpec } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet, type ParamRow } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { font, makeTheme, styleCalc } from "@/lib/excel/styles";
import { MONTHS_ES } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { MunicipalConfig } from "./form";

export const build: TemplateBuild<MunicipalConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const m = ctx.taxes.municipal;
  const regulated = m.regulatedPricePerThousand !== null;
  const baseYear = config.year - 1;
  const title = titleWith(`Impuesto municipal ${config.year}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Impuesto municipal", {
    showGridLines: false,
    tabColor: theme.primary,
  });
  const payments = addSheet(wb, "Pagos", { freezeRows: 4, tabColor: theme.primary });

  const paramRows: ParamRow[] = [
    { key: "year", label: "Año a pagar", value: config.year, kind: "integer" },
    {
      key: "dueDay",
      label: "Día de vencimiento de la cuota mensual",
      value: m.monthlyDueDay,
      kind: "integer",
    },
  ];
  if (regulated)
    paramRows.push({
      key: "regulated",
      label: "Productos con precio regulado (lempiras por millar)",
      value: m.regulatedPricePerThousand,
      kind: "number",
    });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [{ title: m.name, rows: paramRows }],
    tables: [
      {
        key: "brackets",
        title: `Tabla por millar (${m.legalBasis})`,
        columns: [
          { header: "Desde", kind: "currency" },
          { header: "Hasta", kind: "currency" },
          { header: "Por millar", kind: "number" },
        ],
        rows: m.brackets.map((b) => [b.from, b.to, b.perThousand]),
        note: "Cada tramo paga su tasa solo sobre la parte de los ingresos que cae en él. Si tu municipalidad usa otra tabla en su plan de arbitrios, cámbiala aquí.",
      },
    ],
  });
  const P = (row: number, col: number) => params.tableCell("brackets", row, col);

  ws.getColumn(1).width = 2;
  ws.getColumn(2).width = 50;
  for (const c of [3, 4, 5, 6]) ws.getColumn(c).width = 18;
  addSheetHeader(ws, {
    title: `${m.name} — ${config.year}`,
    subtitle: [
      config.businessName || null,
      config.taxId ? `${ctx.taxId.name} ${config.taxId}` : null,
      config.municipality ? `Municipio: ${config.municipality}` : null,
      `Base: ${m.base.toLowerCase()} (${baseYear})`,
    ]
      .filter(Boolean)
      .join(" · "),
    theme,
    width: 5,
    startCol: 2,
  });

  const ex = config.example;
  const incomeFields: FieldSpec[] = [
    {
      key: "income",
      label: `Ingresos por ventas o servicios de ${baseYear}`,
      kind: "currency",
      value: ex ? 3_250_000 : 0,
    },
  ];
  if (regulated)
    incomeFields.push({
      key: "regulated",
      label: "De ellos: ventas de productos con precio regulado",
      kind: "currency",
      value: ex ? 250_000 : 0,
      note: "Estas ventas pagan una tasa por millar distinta (ver Parámetros).",
    });
  incomeFields.push(
    {
      key: "notSubject",
      label: "Menos: ingresos no sujetos según tu municipalidad",
      kind: "currency",
      value: 0,
    },
    {
      key: "base",
      label: "Base para la tabla por tramos",
      kind: "calc",
      resultKind: "currency",
      emphasis: true,
      formula: (ref) =>
        `MAX(0,${ref("income")}${regulated ? `-${ref("regulated")}` : ""}-${ref("notSubject")})`,
    },
  );
  const income = addFields(ws, {
    startRow: 4,
    labelCol: 2,
    valueCol: 3,
    title: `1. Ingresos de ${baseYear} (base del impuesto)`,
    fields: incomeFields,
    theme,
    ctx,
  });
  const base = income.cell("base");

  const brackets = addTable(ws, {
    startRow: income.nextRow + 1,
    startCol: 2,
    columns: [
      {
        key: "from",
        header: "Desde",
        kind: "formula",
        resultKind: "currency",
        formula: (r) => P(r.index, 0),
      },
      {
        key: "to",
        header: "Hasta",
        kind: "formula",
        resultKind: "currency",
        formula: (r) => `IF(${P(r.index, 1)}="","En adelante",${P(r.index, 1)})`,
      },
      {
        key: "rate",
        header: "Lempiras por millar",
        kind: "formula",
        resultKind: "number",
        formula: (r) => P(r.index, 2),
      },
      {
        key: "amount",
        header: "Ingresos en el tramo",
        kind: "formula",
        resultKind: "currency",
        formula: (r) =>
          `MAX(0,IF(${P(r.index, 1)}="",${base},MIN(${base},${P(r.index, 1)}))-${P(r.index, 0)})`,
      },
      {
        key: "tax",
        header: "Impuesto del tramo",
        kind: "formula",
        resultKind: "currency",
        total: "sum",
        formula: (r) => `ROUND(${r.c("amount")}/1000*${r.c("rate")},2)`,
      },
    ],
    rows: m.brackets.length,
    theme,
    ctx,
    totals: { label: "Impuesto por tramos" },
  });
  const tableTitle = ws.getCell(brackets.headerRow - 1, 2);
  tableTitle.value = "2. Cálculo por tramos";
  tableTitle.font = font(theme, { bold: true, color: theme.primaryDark });

  const annualFields: FieldSpec[] = [
    {
      key: "byBrackets",
      label: "Impuesto por tramos",
      kind: "calc",
      resultKind: "currency",
      formula: () => brackets.total("tax"),
    },
  ];
  if (regulated)
    annualFields.push({
      key: "regulatedTax",
      label: "Impuesto sobre productos con precio regulado",
      kind: "calc",
      resultKind: "currency",
      formula: () => `ROUND(${income.cell("regulated")}/1000*${params.ref("regulated")},2)`,
    });
  annualFields.push(
    {
      key: "annual",
      label: "IMPUESTO ANUAL",
      kind: "calc",
      resultKind: "currency",
      emphasis: true,
      formula: (ref) =>
        regulated ? `${ref("byBrackets")}+${ref("regulatedTax")}` : ref("byBrackets"),
    },
    {
      key: "effective",
      label: "Tasa efectiva sobre los ingresos",
      kind: "calc",
      resultKind: "percent",
      formula: (ref) => `IFERROR(${ref("annual")}/${income.cell("income")},0)`,
    },
    {
      key: "quota",
      label: "Cuota mensual del impuesto",
      kind: "calc",
      resultKind: "currency",
      formula: (ref) => `ROUND(${ref("annual")}/12,2)`,
    },
    {
      key: "fees",
      label: "Otras tasas municipales del mes (aseo, bomberos, alumbrado…)",
      kind: "currency",
      value: ex ? 350 : 0,
    },
    {
      key: "monthly",
      label: "TOTAL A PAGAR CADA MES",
      kind: "calc",
      resultKind: "currency",
      emphasis: true,
      formula: (ref) => `${ref("quota")}+${ref("fees")}`,
    },
    {
      key: "permit",
      label: "Permiso de operación y otros cargos anuales",
      kind: "currency",
      value: ex ? 1_500 : 0,
    },
    {
      key: "yearTotal",
      label: "Total a pagar en el año",
      kind: "calc",
      resultKind: "currency",
      emphasis: true,
      formula: (ref) => `${ref("annual")}+${ref("fees")}*12+${ref("permit")}`,
    },
  );
  const annual = addFields(ws, {
    startRow: (brackets.totalRow ?? brackets.lastRow) + 2,
    labelCol: 2,
    valueCol: 3,
    title: "3. Impuesto anual y pago mensual",
    fields: annualFields,
    theme,
    ctx,
  });
  await protectSheet(ws);

  // Calendario de pagos
  addSheetHeader(payments, {
    title: `Pagos a la municipalidad ${config.year}`,
    subtitle: "Anota la fecha, el monto y el recibo de cada pago.",
    theme,
    width: 8,
  });
  const quota = annual.ref("monthly");
  const year = params.ref("year");
  const dueDay = params.ref("dueDay");
  const table = addTable(payments, {
    startRow: 4,
    columns: [
      { key: "month", header: "Mes", kind: "text", width: 13 },
      {
        key: "due",
        header: "Vence",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) => `WORKDAY(DATE(${year},${r.index + 1},${dueDay})-1,1)`,
      },
      {
        key: "quota",
        header: "Cuota",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: () => quota,
      },
      { key: "date", header: "Fecha de pago", kind: "date", width: 12 },
      { key: "paid", header: "Monto pagado", kind: "currency", width: 14, total: "sum" },
      { key: "receipt", header: "N.º de recibo", kind: "text", width: 14 },
      {
        key: "pending",
        header: "Pendiente",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `MAX(0,${r.c("quota")}-N(${r.c("paid")}))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("quota")}=0,"",IF(N(${r.c("paid")})>=${r.c("quota")},"Pagado",IF(TODAY()>${r.c("due")},"Vencido","Pendiente")))`,
      },
    ],
    rows: 12,
    theme,
    ctx,
    totals: { label: "Total" },
    example: MONTHS_ES.map((month, i) =>
      ex && i < 2
        ? {
            month,
            date: exampleDate(config.year, i + 1, 8),
            paid: 447.92,
            receipt: `M-${1001 + i}`,
          }
        : { month },
    ),
  });
  // Los meses son etiquetas fijas
  for (let r = table.firstRow; r <= table.lastRow; r++) {
    const cell = payments.getCell(r, table.colNumber("month"));
    styleCalc(cell, theme);
    cell.font = font(theme, { bold: true });
    cell.protection = { locked: true };
  }
  const s = table.letter("status");
  const rowRange = `A${table.firstRow}:${s}${table.lastRow}`;
  highlightWhen(
    payments,
    rowRange,
    `$${s}${table.firstRow}="Vencido"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(payments, rowRange, `$${s}${table.firstRow}="Pagado"`, { color: theme.muted }, 2);
  await protectSheet(payments);

  const declarationMonth = (MONTHS_ES[m.declarationMonth - 1] ?? "").toLowerCase();
  addInstructionsSheet(wb, {
    title: m.name,
    description: `Estima el impuesto municipal de ${config.year} con tus ingresos de ${baseYear} y lleva el control de los pagos mensuales a tu municipalidad.`,
    steps: [
      `Escribe tus ingresos por ventas o servicios de ${baseYear} (los mismos que declaras en ${declarationMonth}).`,
      ...(regulated
        ? ["Si vendes productos con precio regulado por el Estado, escribe esas ventas aparte."]
        : []),
      "Resta los ingresos que tu municipalidad no grava, si aplica.",
      "El impuesto se calcula por tramos con la tabla de Parámetros y se divide en 12 cuotas.",
      "Agrega las tasas mensuales (aseo, bomberos, alumbrado) y el permiso de operación según tu recibo.",
      "En la hoja Pagos anota cada pago: los meses vencidos se marcan en rojo.",
    ],
    sheets: [
      { name: "Impuesto municipal", description: "Base, cálculo por tramos e impuesto anual." },
      { name: "Pagos", description: "Calendario de 12 cuotas con su estado." },
      { name: "Parámetros", description: "Tabla por millar y día de vencimiento." },
    ],
    tips: [
      `La declaración jurada del volumen de ventas del año anterior se presenta en ${declarationMonth}.`,
      "Cada municipalidad aprueba su plan de arbitrios: confirma la tabla, las tasas y los recargos en la tuya.",
      "Si empezaste a operar este año, usa los ingresos que estimas tener.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
