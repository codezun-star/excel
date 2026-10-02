import "server-only";

import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { colLetter } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  solidFill,
  styleCalc,
  styleHeader,
  styleLabel,
  styleTotal,
  type SheetTheme,
} from "@/lib/excel/styles";
import { addTable, formatFor, type ColumnKind } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { PlanConfig } from "./form";

const MONTHS = 12;
type Kind = Exclude<ColumnKind, "formula" | "list">;

const PRODUCTS: [string, number, number, number, number][] = [
  ["Café y bebidas", 35, 10, 900, 0.03],
  ["Baleadas y desayunos", 30, 12, 1200, 0.02],
  ["Repostería", 45, 18, 400, 0.04],
];
const FIXED: [string, number, number][] = [
  ["Alquiler del local", 12000, 1],
  ["Salarios", 30000, 1],
  ["Energía y agua", 3500, 1],
  ["Internet y teléfono", 900, 1],
  ["Publicidad", 3000, 1],
  ["Contador", 2000, 1],
  ["Nuevo empleado", 9000, 4],
];
const INVESTMENT: [string, number, string][] = [
  ["Equipo de cocina", 120000, "Equipo y mobiliario"],
  ["Mesas y sillas", 40000, "Equipo y mobiliario"],
  ["Permisos, rótulo y apertura", 15000, "Gastos de apertura"],
  ["Inventario inicial y reserva", 25000, "Capital de trabajo"],
];

function firstOfNextMonth(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

/** Escribe una fila de 12 meses (columnas B a M) con su total en N. */
class Grid {
  row: number;
  constructor(
    private ws: ExcelJS.Worksheet,
    private theme: SheetTheme,
    private ctx: CountryContext,
    start: number,
  ) {
    this.row = start;
  }
  col(m: number) {
    return colLetter(2 + m);
  }
  section(title: string) {
    this.row++;
    const c = this.ws.getCell(this.row, 1);
    c.value = title;
    c.font = font(this.theme, { bold: true, size: 12, color: this.theme.primaryDark });
    this.row++;
  }
  line(
    label: string,
    f: (m: number, col: string) => string,
    opts: { kind?: Kind; total?: "sum" | "last" | "none"; strong?: boolean } = {},
  ): number {
    const r = this.row++;
    const l = this.ws.getCell(r, 1);
    l.value = label;
    styleLabel(l, this.theme, opts.strong ?? false);
    const fmt = formatFor(opts.kind ?? "currency", this.ctx);
    for (let m = 0; m < MONTHS; m++) {
      const c = this.ws.getCell(r, 2 + m);
      c.value = { formula: f(m, this.col(m)) };
      if (opts.strong) styleTotal(c, this.theme);
      else styleCalc(c, this.theme);
      if (fmt) c.numFmt = fmt;
    }
    const t = this.ws.getCell(r, 2 + MONTHS);
    const total = opts.total ?? "sum";
    if (total !== "none") {
      t.value = { formula: total === "sum" ? `SUM(B${r}:M${r})` : `M${r}` };
      if (fmt) t.numFmt = fmt;
    }
    styleTotal(t, this.theme);
    return r;
  }
}

export const build: TemplateBuild<PlanConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Plan de negocio a 12 meses", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const sup = addSheet(wb, "Supuestos", { tabColor: theme.primary });
  const pro = addSheet(wb, "Proyección", {
    freezeRows: 4,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const ind = addSheet(wb, "Indicadores", { tabColor: theme.primary });
  const ex = config.example;

  // ----------------------------------------------------------- Supuestos
  addSheetHeader(sup, {
    title,
    subtitle: "Cambia los supuestos y toda la proyección se recalcula.",
    theme,
    width: 7,
  });
  const f = addFields(sup, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "start",
        label: "Primer mes de operación",
        kind: "date",
        value: config.start || firstOfNextMonth(),
      },
      { key: "own", label: "Aporte propio", kind: "currency", value: config.own },
      { key: "loan", label: "Préstamo", kind: "currency", value: config.loan },
      { key: "rate", label: "Tasa de interés anual", kind: "percent", value: config.rate / 100 },
      { key: "term", label: "Plazo del préstamo (meses)", kind: "integer", value: config.term },
      { key: "life", label: "Vida útil del equipo (años)", kind: "integer", value: 5 },
      {
        key: "tax",
        label: "Impuesto sobre la utilidad (estimado)",
        kind: "percent",
        value: 0,
        note: "Escribe la tasa que te corresponda según tu régimen; consulta a tu contador.",
      },
      { key: "minCash", label: "Efectivo mínimo deseado", kind: "currency", value: 10000 },
    ],
    theme,
    ctx,
  });
  sup.getColumn(1).width = 34;
  const S = (k: string) => f.ref(k);

  const pt = addTable(sup, {
    startRow: f.nextRow + 2,
    columns: [
      { key: "name", header: "Producto o servicio", kind: "text", width: 34 },
      { key: "price", header: "Precio de venta", kind: "currency", width: 14 },
      { key: "cost", header: "Costo unitario", kind: "currency", width: 14 },
      { key: "units", header: "Unidades en el mes 1", kind: "number", width: 13 },
      { key: "growth", header: "Crecimiento mensual", kind: "percent", width: 12 },
      {
        key: "margin",
        header: "Margen por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) => `IF(${r.c("name")}="","",${r.c("price")}-${r.c("cost")})`,
      },
      {
        key: "marginPct",
        header: "Margen %",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("price")})=0),"",${r.c("margin")}/${r.c("price")})`,
      },
    ],
    rows: 10,
    theme,
    ctx,
    headerHeight: 30,
    example: ex
      ? PRODUCTS.map(([name, price, cost, units, growth]) => ({ name, price, cost, units, growth }))
      : undefined,
  });
  const ft = addTable(sup, {
    startRow: pt.lastRow + 3,
    columns: [
      { key: "concept", header: "Gasto fijo mensual", kind: "text", width: 34 },
      { key: "amount", header: "Monto mensual", kind: "currency", width: 14, total: "sum" },
      { key: "from", header: "Desde el mes (1 a 12)", kind: "integer", width: 14, fill: 1 },
    ],
    rows: 15,
    theme,
    ctx,
    totals: { label: "Total desde el mes 1 y posteriores" },
    example: ex ? FIXED.map(([concept, amount, from]) => ({ concept, amount, from })) : undefined,
  });
  const it = addTable(sup, {
    startRow: ft.totalRow! + 3,
    columns: [
      { key: "concept", header: "Inversión inicial", kind: "text", width: 34 },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 24,
        list: ["Equipo y mobiliario", "Gastos de apertura", "Capital de trabajo"],
      },
    ],
    rows: 10,
    theme,
    ctx,
    totals: { label: "Inversión total" },
    example: ex
      ? INVESTMENT.map(([concept, amount, type]) => ({ concept, amount, type }))
      : undefined,
  });
  const inv = addFields(sup, {
    startRow: it.totalRow! + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "equipment",
        label: "Equipo y mobiliario (se deprecia)",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${it.range("amount")},${it.range("type")},"Equipo y mobiliario")`,
      },
      {
        key: "opening",
        label: "Gastos de apertura",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${it.range("amount")},${it.range("type")},"Gastos de apertura")`,
      },
      {
        key: "total",
        label: "Inversión total",
        kind: "calc",
        resultKind: "currency",
        formula: () => it.total("amount"),
      },
      {
        key: "funds",
        label: "Financiamiento (aporte + préstamo)",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${f.cell("own")}+${f.cell("loan")}`,
      },
      {
        key: "cash0",
        label: "Efectivo al iniciar operaciones",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `${c("funds")}-${c("equipment")}-${c("opening")}`,
      },
      {
        key: "payment",
        label: "Cuota mensual del préstamo",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `IF(${f.cell("loan")}<=0,0,IF(${f.cell("rate")}=0,${f.cell("loan")}/${f.cell("term")},PMT(${f.cell("rate")}/12,${f.cell("term")},-${f.cell("loan")})))`,
      },
    ],
    theme,
    ctx,
  });
  const I = (k: string) => inv.ref(k);
  const cash0Cell = inv.cell("cash0").replace(/\$/g, "");
  highlightWhen(sup, cash0Cell, `${cash0Cell}<0`, { fill: theme.dangerSoft, bold: true }, 1);

  // ----------------------------------------------------------- Proyección
  addSheetHeader(pro, {
    title: "Proyección de 12 meses",
    subtitle: "Todo se calcula con la hoja Supuestos.",
    theme,
    width: 14,
  });
  pro.getColumn(1).width = 34;
  const head = ["Concepto", ...Array.from({ length: MONTHS }, () => ""), "Total del año"];
  head.forEach((h, i) => {
    const c = pro.getCell(4, i + 1);
    c.value = i >= 1 && i <= MONTHS ? { formula: `EDATE(${S("start")},${i - 1})` } : h;
    styleHeader(c, theme);
    if (i >= 1 && i <= MONTHS) c.numFmt = "mmm yyyy";
    pro.getColumn(i + 1).width = i === 0 ? 34 : 13;
  });
  const g = new Grid(pro, theme, ctx, 4);
  const P = (key: string, i: number) => `'Supuestos'!${pt.cell(key, pt.firstRow + i, true)}`;

  g.section("Unidades vendidas");
  const unitRows: number[] = [];
  for (let i = 0; i < 10; i++) {
    unitRows.push(
      g.line(
        `=IF(${P("name", i)}="","",${P("name", i)})`,
        (m) =>
          `IF(${P("name", i)}="",0,ROUND(N(${P("units", i)})*(1+N(${P("growth", i)}))^${m},0))`,
        { kind: "integer" },
      ),
    );
  }
  // Las etiquetas de producto son fórmulas
  unitRows.forEach(
    (r, i) => (pro.getCell(r, 1).value = { formula: `IF(${P("name", i)}="","",${P("name", i)})` }),
  );
  const unitRange = (col: string) => `${col}${unitRows[0]}:${col}${unitRows[unitRows.length - 1]}`;

  g.section("Estado de resultados");
  const sales = g.line(
    "Ventas",
    (_, c) => `SUMPRODUCT(${unitRange(c)},'Supuestos'!${pt.range("price")})`,
    { strong: true },
  );
  const cogs = g.line(
    "Costo de ventas",
    (_, c) => `SUMPRODUCT(${unitRange(c)},'Supuestos'!${pt.range("cost")})`,
  );
  const gross = g.line("Utilidad bruta", (_, c) => `${c}${sales}-${c}${cogs}`, { strong: true });
  const fixed = g.line(
    "Gastos fijos",
    (m) =>
      `SUMIFS('Supuestos'!${ft.range("amount")},'Supuestos'!${ft.range("from")},"<="&${m + 1})`,
  );
  const dep = g.line(
    "Depreciación del equipo",
    () => `IF(N(${S("life")})=0,0,${I("equipment")}/(${S("life")}*12))`,
  );
  const ebit = g.line("Utilidad de operación", (_, c) => `${c}${gross}-${c}${fixed}-${c}${dep}`, {
    strong: true,
  });
  // Préstamo: sección siguiente (en blanco y título ocupan dos filas tras utilidad neta)
  const loanBase = g.row + 5;
  const interestRow = loanBase + 1;
  const ebt = g.line("Utilidad antes de impuestos", (_, c) => `${c}${ebit}-${c}${interestRow}`);
  const tax = g.line("Impuesto estimado", (_, c) => `MAX(0,${c}${ebt}*${S("tax")})`);
  const net = g.line("Utilidad neta", (_, c) => `${c}${ebt}-${c}${tax}`, { strong: true });

  g.section("Préstamo");
  if (g.row !== loanBase) throw new Error("Fila del préstamo inesperada");
  const pay = g.line("Cuota", (m) => `IF(${m + 1}>${S("term")},0,${I("payment")})`);
  const interest = g.line(
    "Intereses",
    (m) =>
      `IF(${m + 1}>${S("term")},0,ROUND(${m === 0 ? S("loan") : `${g.col(m - 1)}${loanBase + 3}`}*${S("rate")}/12,2))`,
  );
  const principal = g.line("Abono a capital", (_, c) => `${c}${pay}-${c}${interest}`);
  const balance = g.line(
    "Saldo del préstamo",
    (m, c) => `MAX(0,${m === 0 ? S("loan") : `${g.col(m - 1)}${loanBase + 3}`}-${c}${principal})`,
    { total: "last" },
  );
  if (interest !== interestRow || balance !== loanBase + 3)
    throw new Error("Filas del préstamo inesperadas");

  g.section("Flujo de caja");
  const startCash = g.row;
  const opening = g.line(
    "Efectivo al inicio del mes",
    (m) => (m === 0 ? I("cash0") : `${g.col(m - 1)}${startCash + 4}`),
    { total: "none" },
  );
  g.line("+ Utilidad neta", (_, c) => `${c}${net}`);
  g.line("+ Depreciación (no sale efectivo)", (_, c) => `${c}${dep}`);
  const flow = g.line("Flujo del mes", (_, c) => `${c}${net}+${c}${dep}-${c}${principal}`, {
    strong: true,
  });
  const closing = g.line("Efectivo al final del mes", (_, c) => `${c}${opening}+${c}${flow}`, {
    strong: true,
    total: "last",
  });
  if (closing !== startCash + 4) throw new Error("Fila de efectivo inesperada");
  const profitFlag = g.line("¿Mes con ganancia? (1 = sí)", (_, c) => `IF(${c}${ebit}>0,1,0)`, {
    kind: "integer",
    total: "none",
  });
  highlightWhen(
    pro,
    `B${closing}:M${closing}`,
    `B${closing}<${S("minCash")}`,
    { fill: theme.dangerSoft, bold: true },
    1,
  );
  highlightWhen(pro, `B${net}:M${net}`, `B${net}<0`, { color: theme.danger }, 2);
  pro.getRow(profitFlag).font = font(theme, { size: 9, color: theme.muted });

  // ----------------------------------------------------------- Indicadores
  addSheetHeader(ind, {
    title: "Indicadores del plan",
    subtitle: "Resumen para presentar a socios, bancos o programas de apoyo.",
    theme,
    width: 3,
  });
  const R = (row: number) => `'Proyección'!$N$${row}`;
  const k = addFields(ind, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "sales",
        label: "Ventas del año",
        kind: "calc",
        resultKind: "currency",
        formula: () => R(sales),
      },
      {
        key: "gross",
        label: "Margen bruto",
        kind: "calc",
        resultKind: "percent",
        formula: () => `IF(${R(sales)}=0,0,${R(gross)}/${R(sales)})`,
      },
      {
        key: "net",
        label: "Utilidad neta del año",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => R(net),
      },
      {
        key: "netPct",
        label: "Margen neto",
        kind: "calc",
        resultKind: "percent",
        formula: () => `IF(${R(sales)}=0,0,${R(net)}/${R(sales)})`,
      },
      {
        key: "be",
        label: "Punto de equilibrio mensual promedio (ventas)",
        kind: "calc",
        resultKind: "currency",
        formula: (c) =>
          `IF(N(${c("gross")})<=0,"",(${R(fixed)}+${R(dep)}+${R(interest)})/12/${c("gross")})`,
      },
      {
        key: "firstProfit",
        label: "Primer mes con utilidad de operación",
        kind: "calc",
        resultKind: "text",
        formula: () =>
          `IFERROR("Mes "&MATCH(1,'Proyección'!$B$${profitFlag}:$M$${profitFlag},0),"No se alcanza en el año")`,
      },
      {
        key: "minCash",
        label: "Efectivo más bajo del año",
        kind: "calc",
        resultKind: "currency",
        formula: () => `MIN('Proyección'!$B$${closing}:$M$${closing})`,
      },
      {
        key: "endCash",
        label: "Efectivo al final del año",
        kind: "calc",
        resultKind: "currency",
        formula: () => R(closing),
      },
      {
        key: "roi",
        label: "Retorno de la inversión en el año",
        kind: "calc",
        resultKind: "percent",
        formula: () => `IF(N(${I("total")})=0,"",${R(net)}/${I("total")})`,
      },
      {
        key: "debt",
        label: "Saldo del préstamo al cierre",
        kind: "calc",
        resultKind: "currency",
        formula: () => R(balance),
      },
    ],
    theme,
    ctx,
  });
  ind.getColumn(1).width = 46;
  ind.getColumn(2).width = 22;
  const minCell = k.cell("minCash").replace(/\$/g, "");
  highlightWhen(
    ind,
    minCell,
    `${minCell}<${S("minCash")}`,
    { fill: theme.dangerSoft, bold: true },
    1,
  );
  const note = ind.getCell(k.nextRow + 1, 1);
  note.value =
    "Si el efectivo más bajo queda por debajo del mínimo, necesitas más capital, un préstamo mayor o reducir gastos al inicio.";
  note.font = font(theme, { italic: true, size: 10, color: theme.muted });
  note.alignment = { wrapText: true };
  ind.mergeCells(k.nextRow + 1, 1, k.nextRow + 1, 3);
  ind.getRow(k.nextRow + 1).height = 30;
  ind.getCell(1, 1).fill = solidFill("#FFFFFF");

  for (const w of [sup, pro, ind]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Plan de negocio a 12 meses",
    description: "Prueba tu idea con números antes de invertir y presenta un plan claro.",
    steps: [
      "En Supuestos escribe tus productos con precio, costo, unidades del primer mes y crecimiento mensual esperado.",
      "Agrega los gastos fijos y el mes en que empiezan; luego la inversión inicial con su tipo.",
      "Revisa el aporte propio, el préstamo y el efectivo con que inicias.",
      "Proyección muestra el estado de resultados, el préstamo y el flujo de caja de cada mes; los meses con efectivo bajo se marcan en rojo.",
      "Indicadores resume ventas, márgenes, punto de equilibrio, primer mes con ganancia y retorno.",
    ],
    tips: [
      "Sé conservador con las ventas y generoso con los gastos: es mejor llevarse una sorpresa buena.",
      "Los precios van sin ISV: el impuesto que cobras no es ingreso del negocio.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
