import "server-only";

import type ExcelJS from "exceljs";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  styleCalc,
  styleHeader,
  styleInput,
  styleLabel,
  styleTotal,
  type SheetTheme,
} from "@/lib/excel/styles";
import { addTable, formatFor, type ColumnKind } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import type { CountryContext } from "@/countries";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { RentabilidadConfig } from "./form";

type Kind = Exclude<ColumnKind, "formula" | "list">;

/** Comparador: cada fila es un dato o un cálculo y cada columna una propiedad. */
function addComparison(
  ws: ExcelJS.Worksheet,
  theme: SheetTheme,
  ctx: CountryContext,
  startRow: number,
  inputs: [string, string, Kind, number[]][],
  calcs: [string, string, Kind, (c: (k: string) => string) => string][],
) {
  const cols = [2, 3, 4];
  const rowOf = new Map<string, number>();
  const head = ws.getCell(startRow, 1);
  head.value = "Concepto";
  styleHeader(head, theme);
  ["Propiedad A", "Propiedad B", "Propiedad C"].forEach((t, i) => {
    const c = ws.getCell(startRow, cols[i]!);
    c.value = t;
    styleHeader(c, theme);
  });
  let row = startRow + 1;
  for (const [key, label, kind, values] of inputs) {
    rowOf.set(key, row);
    const l = ws.getCell(row, 1);
    l.value = label;
    styleLabel(l, theme, false);
    cols.forEach((col, i) => {
      const c = ws.getCell(row, col);
      c.value = values[i] ?? null;
      styleInput(c, theme);
      const fmt = formatFor(kind, ctx);
      if (fmt) c.numFmt = fmt;
    });
    row++;
  }
  row++;
  const out = new Map<string, number>();
  for (const [key, label, kind, formula] of calcs) {
    rowOf.set(key, row);
    out.set(key, row);
    const l = ws.getCell(row, 1);
    l.value = label;
    styleLabel(l, theme, true);
    cols.forEach((col) => {
      const letter = ws.getColumn(col).letter;
      const c = ws.getCell(row, col);
      c.value = { formula: formula((k) => `${letter}${rowOf.get(k)}`) };
      if (key === "coc" || key === "cf") styleTotal(c, theme);
      else styleCalc(c, theme);
      const fmt = formatFor(kind, ctx);
      if (fmt) c.numFmt = fmt;
    });
    row++;
  }
  return { rowOf, lastRow: row - 1 };
}

export const build: TemplateBuild<RentabilidadConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Rentabilidad inmobiliaria", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Análisis", { tabColor: theme.primary, landscape: true });
  const cmp = addSheet(wb, "Comparar", { tabColor: theme.primary });
  const p = config.price;

  addSheetHeader(ws, {
    title: titleWith("Análisis de rentabilidad", config.property),
    subtitle: "Cambia los datos en blanco: todo lo demás se recalcula.",
    theme,
    width: 11,
  });
  const inp = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "price", label: "Precio de compra", kind: "currency", value: p },
      {
        key: "closing",
        label: "Gastos de cierre (escritura, timbres, honorarios)",
        kind: "percent",
        value: 0.04,
        note: "Estimado como porcentaje del precio; ajústalo a tu cotización.",
      },
      {
        key: "reno",
        label: "Remodelación y muebles",
        kind: "currency",
        value: config.example ? 80000 : 0,
      },
      { key: "down", label: "Prima o enganche", kind: "percent", value: config.downPayment / 100 },
      { key: "rate", label: "Tasa de interés anual", kind: "percent", value: config.rate / 100 },
      { key: "term", label: "Plazo del préstamo (años)", kind: "integer", value: config.termYears },
      { key: "rent", label: "Renta mensual", kind: "currency", value: config.rent },
      { key: "vacancy", label: "Vacancia", kind: "percent", value: config.vacancy / 100 },
      {
        key: "tax",
        label: "Impuesto de bienes inmuebles (anual)",
        kind: "currency",
        value: Math.round(p * 0.0035),
      },
      { key: "maint", label: "Mantenimiento (% de la renta)", kind: "percent", value: 0.06 },
      { key: "insurance", label: "Seguro (anual)", kind: "currency", value: Math.round(p * 0.003) },
      { key: "admin", label: "Administración (% de la renta)", kind: "percent", value: 0 },
      { key: "hoa", label: "Cuota de residencial (mensual)", kind: "currency", value: 0 },
      { key: "rentGrowth", label: "Aumento anual de la renta", kind: "percent", value: 0.03 },
      { key: "costGrowth", label: "Aumento anual de los gastos", kind: "percent", value: 0.04 },
      { key: "appreciation", label: "Plusvalía anual", kind: "percent", value: 0.04 },
      { key: "years", label: "Años de análisis (1 a 30)", kind: "integer", value: config.years },
      { key: "sale", label: "Costo de venta al final (% del valor)", kind: "percent", value: 0.05 },
    ],
    theme,
    ctx,
  });
  ws.getColumn(1).width = 40;
  const I = (k: string) => inp.cell(k);
  const res = addFields(ws, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "initial",
        label: "Inversión inicial en efectivo",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${I("price")}*${I("down")}+${I("price")}*${I("closing")}+${I("reno")}`,
      },
      {
        key: "loan",
        label: "Monto del préstamo",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${I("price")}*(1-${I("down")})`,
      },
      {
        key: "payment",
        label: "Cuota mensual del préstamo",
        kind: "calc",
        resultKind: "currency",
        formula: (c) =>
          `IF(${c("loan")}<=0,0,IF(${I("rate")}=0,${c("loan")}/(${I("term")}*12),PMT(${I("rate")}/12,${I("term")}*12,-${c("loan")})))`,
      },
      {
        key: "gross",
        label: "Renta bruta anual",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${I("rent")}*12`,
      },
      {
        key: "effective",
        label: "Renta efectiva (menos vacancia)",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `${c("gross")}*(1-${I("vacancy")})`,
      },
      {
        key: "opex",
        label: "Gastos operativos del año 1",
        kind: "calc",
        resultKind: "currency",
        formula: (c) =>
          `${I("tax")}+${I("insurance")}+${I("hoa")}*12+${c("effective")}*(${I("maint")}+${I("admin")})`,
      },
      {
        key: "noi",
        label: "Ingreso neto operativo (NOI)",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `${c("effective")}-${c("opex")}`,
      },
      {
        key: "debt",
        label: "Pago anual del préstamo",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `${c("payment")}*12`,
      },
      {
        key: "cf",
        label: "Flujo de caja del año 1",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `${c("noi")}-${c("debt")}`,
      },
      {
        key: "cfm",
        label: "Flujo de caja mensual",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `${c("cf")}/12`,
      },
      {
        key: "grossYield",
        label: "Rentabilidad bruta",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => `IF(${I("price")}=0,0,${c("gross")}/${I("price")})`,
      },
      {
        key: "cap",
        label: "Cap rate (NOI ÷ precio)",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => `IF(${I("price")}=0,0,${c("noi")}/${I("price")})`,
      },
      {
        key: "coc",
        label: "Retorno sobre el efectivo invertido",
        kind: "calc",
        resultKind: "percent",
        emphasis: true,
        formula: (c) => `IF(${c("initial")}=0,0,${c("cf")}/${c("initial")})`,
      },
      {
        key: "dscr",
        label: "Cobertura de la deuda (NOI ÷ pago)",
        kind: "calc",
        resultKind: "number",
        formula: (c) => `IF(${c("debt")}=0,"",${c("noi")}/${c("debt")})`,
      },
    ],
    theme,
    ctx,
  });
  const C = (k: string) => res.cell(k);
  ws.getColumn(4).width = 18;
  ws.getColumn(5).width = 18;

  const startRow = Math.max(inp.nextRow, res.nextRow + 5) + 2;
  const Y = I("years");
  const table = addTable(ws, {
    startRow,
    columns: [
      {
        key: "year",
        header: "Año",
        kind: "formula",
        resultKind: "integer",
        width: 8,
        align: "center",
        formula: (r) => (r.index === 0 ? "0" : `IF(${r.index}>${Y},"",${r.index})`),
      },
      {
        key: "income",
        header: "Renta efectiva",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          r.index === 0
            ? "0"
            : `IF(${r.c("year")}="","",${C("effective")}*(1+${I("rentGrowth")})^(${r.c("year")}-1))`,
      },
      {
        key: "opex",
        header: "Gastos operativos",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          r.index === 0
            ? "0"
            : `IF(${r.c("year")}="","",${C("opex")}*(1+${I("costGrowth")})^(${r.c("year")}-1))`,
      },
      {
        key: "noi",
        header: "NOI",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        allowNegative: true,
        formula: (r) => `IF(${r.c("year")}="","",${r.c("income")}-${r.c("opex")})`,
      },
      {
        key: "debt",
        header: "Pago del préstamo",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          r.index === 0
            ? "0"
            : `IF(${r.c("year")}="","",IF(${r.c("year")}<=${I("term")},${C("debt")},0))`,
      },
      {
        key: "cf",
        header: "Flujo de caja",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        allowNegative: true,
        formula: (r) =>
          r.index === 0
            ? `-${C("initial")}`
            : `IF(${r.c("year")}="","",${r.c("noi")}-${r.c("debt")})`,
      },
      {
        key: "cum",
        header: "Flujo acumulado",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        allowNegative: true,
        formula: (r) =>
          r.index === 0 ? r.c("cf") : `IF(${r.c("year")}="","",${r.prev("cum")}+${r.c("cf")})`,
      },
      {
        key: "value",
        header: "Valor de la propiedad",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        formula: (r) =>
          `IF(${r.c("year")}="","",${I("price")}*(1+${I("appreciation")})^${r.c("year")})`,
      },
      {
        key: "balance",
        header: "Saldo del préstamo",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) =>
          r.index === 0
            ? C("loan")
            : `IF(${r.c("year")}="","",IF(OR(${r.c("year")}>=${I("term")},${C("loan")}<=0),0,MAX(0,-FV(${I("rate")}/12,${r.c("year")}*12,-${C("payment")},${C("loan")}))))`,
      },
      {
        key: "equity",
        header: "Patrimonio",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        allowNegative: true,
        formula: (r) => `IF(${r.c("year")}="","",${r.c("value")}-${r.c("balance")})`,
      },
      {
        key: "irr",
        header: "Flujo con venta",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        allowNegative: true,
        formula: (r) =>
          r.index === 0
            ? r.c("cf")
            : `IF(${r.c("year")}="","",${r.c("cf")}+IF(${r.c("year")}=${Y},${r.c("value")}*(1-${I("sale")})-${r.c("balance")},0))`,
      },
    ],
    rows: 31,
    theme,
    ctx,
    headerHeight: 30,
  });
  const cumCol = table.letter("cum");
  highlightWhen(
    ws,
    `${cumCol}${table.firstRow}:${cumCol}${table.lastRow}`,
    `AND(ISNUMBER(${cumCol}${table.firstRow}),${cumCol}${table.firstRow}<0)`,
    { color: theme.danger },
    1,
  );
  addFields(ws, {
    startRow: res.nextRow + 1,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "irr",
        label: "TIR al vender al final",
        kind: "calc",
        resultKind: "percent",
        emphasis: true,
        formula: () => `IFERROR(IRR(${table.range("irr")}),"")`,
      },
      {
        key: "profit",
        label: "Ganancia neta total",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUM(${table.range("irr")})`,
      },
      {
        key: "payback",
        label: "Años para recuperar el efectivo",
        kind: "calc",
        resultKind: "text",
        formula: () =>
          `IF(INDEX(${table.range("cum")},${Y}+1)<0,"No se recupera en "&${Y}&" años",COUNTIF(${table.range("cum")},"<0")&IF(COUNTIF(${table.range("cum")},"<0")=1," año"," años"))`,
      },
      {
        key: "equityEnd",
        label: "Patrimonio al final",
        kind: "calc",
        resultKind: "currency",
        formula: () => `INDEX(${table.range("equity")},${Y}+1)`,
      },
    ],
    theme,
    ctx,
  });

  addSheetHeader(cmp, {
    title: "Comparar propiedades",
    subtitle: "Escribe los datos de hasta 3 opciones y compara sus resultados.",
    theme,
    width: 4,
  });
  cmp.getColumn(1).width = 38;
  [2, 3, 4].forEach((c) => (cmp.getColumn(c).width = 16));
  const ex = config.example;
  const comp = addComparison(
    cmp,
    theme,
    ctx,
    4,
    [
      ["price", "Precio de compra", "currency", ex ? [p, 1500000, 3200000] : [p]],
      ["closing", "Gastos de cierre", "percent", [0.04, 0.04, 0.04]],
      ["reno", "Remodelación y muebles", "currency", ex ? [80000, 150000, 0] : [0, 0, 0]],
      [
        "down",
        "Prima o enganche",
        "percent",
        [config.downPayment / 100, config.downPayment / 100, config.downPayment / 100],
      ],
      [
        "rate",
        "Tasa de interés anual",
        "percent",
        [config.rate / 100, config.rate / 100, config.rate / 100],
      ],
      ["term", "Plazo (años)", "integer", [config.termYears, config.termYears, config.termYears]],
      ["rent", "Renta mensual", "currency", ex ? [config.rent, 11000, 26000] : [config.rent]],
      [
        "vacancy",
        "Vacancia",
        "percent",
        [config.vacancy / 100, config.vacancy / 100, config.vacancy / 100],
      ],
      [
        "fixed",
        "Gastos fijos anuales (impuesto, seguro, cuota)",
        "currency",
        ex ? [Math.round(p * 0.0065), 9000, 24000] : [Math.round(p * 0.0065)],
      ],
      ["var", "Gastos variables (% de la renta)", "percent", [0.06, 0.06, 0.06]],
    ],
    [
      [
        "initial",
        "Inversión inicial en efectivo",
        "currency",
        (c) => `IF(${c("price")}="","",${c("price")}*(${c("down")}+${c("closing")})+${c("reno")})`,
      ],
      [
        "loan",
        "Préstamo",
        "currency",
        (c) => `IF(${c("price")}="","",${c("price")}*(1-${c("down")}))`,
      ],
      [
        "payment",
        "Cuota mensual",
        "currency",
        (c) =>
          `IF(${c("price")}="","",IF(${c("loan")}<=0,0,IF(N(${c("rate")})=0,${c("loan")}/(${c("term")}*12),PMT(${c("rate")}/12,${c("term")}*12,-${c("loan")}))))`,
      ],
      [
        "noi",
        "Ingreso neto operativo (NOI)",
        "currency",
        (c) =>
          `IF(${c("price")}="","",${c("rent")}*12*(1-${c("vacancy")})*(1-${c("var")})-${c("fixed")})`,
      ],
      [
        "cf",
        "Flujo de caja anual",
        "currency",
        (c) => `IF(${c("price")}="","",${c("noi")}-${c("payment")}*12)`,
      ],
      ["cfm", "Flujo de caja mensual", "currency", (c) => `IF(${c("price")}="","",${c("cf")}/12)`],
      [
        "gross",
        "Rentabilidad bruta",
        "percent",
        (c) => `IF(N(${c("price")})=0,"",${c("rent")}*12/${c("price")})`,
      ],
      ["cap", "Cap rate", "percent", (c) => `IF(N(${c("price")})=0,"",${c("noi")}/${c("price")})`],
      [
        "coc",
        "Retorno sobre el efectivo",
        "percent",
        (c) => `IF(N(${c("initial")})=0,"",${c("cf")}/${c("initial")})`,
      ],
    ],
  );
  const cocRow = comp.rowOf.get("coc")!;
  highlightWhen(
    cmp,
    `B${cocRow}:D${cocRow}`,
    `AND(ISNUMBER(B${cocRow}),B${cocRow}=MAX($B$${cocRow}:$D$${cocRow}))`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  const note = cmp.getCell(comp.lastRow + 2, 1);
  note.value = "La mejor opción según el retorno sobre el efectivo se resalta en verde.";
  note.font = font(theme, { italic: true, size: 10, color: theme.muted });

  for (const w of [ws, cmp]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Rentabilidad inmobiliaria",
    description: "Decide con números si una propiedad conviene para alquilar antes de comprarla.",
    steps: [
      "En Análisis escribe el precio, la prima, la tasa y el plazo del préstamo que te ofrece el banco.",
      "Ajusta la renta esperada, la vacancia y los gastos: impuesto de bienes inmuebles, mantenimiento, seguro y cuota de residencial.",
      "Revisa el flujo de caja mensual, el cap rate y el retorno sobre el efectivo; la tabla proyecta los años con plusvalía y saldo del préstamo.",
      `En Comparar pon hasta 3 opciones para ver cuál rinde más por cada ${ctx.currency.name.singular.toLowerCase()} invertido.`,
    ],
    tips: [
      "Un flujo de caja negativo significa que pondrás dinero cada mes aunque la propiedad gane plusvalía.",
      "Los gastos de cierre, la plusvalía y los aumentos son estimados: cámbialos según tu caso.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
