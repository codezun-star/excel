import "server-only";

import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { FMT, currencyFormat } from "@/lib/excel/formats";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { absAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  solidFill,
  styleCalc,
  styleHeader,
  styleInput,
  styleTotal,
  type SheetTheme,
} from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { EstadosConfig } from "./form";

type Line =
  | { kind: "section"; label: string }
  | { kind: "input"; key: string; label: string; example: [number, number]; negative?: boolean }
  | {
      kind: "calc";
      key: string;
      label: string;
      formula: (col: (key: string) => string, index: 0 | 1) => string;
      emphasis?: boolean;
      percent?: boolean;
    };

/** Escribe un estado financiero con dos columnas (actual y anterior) y variación. */
function writeStatement(
  ws: ExcelJS.Worksheet,
  lines: Line[],
  opts: {
    startRow: number;
    theme: SheetTheme;
    ctx: CountryContext;
    years: [number, number];
    example: boolean;
  },
): (key: string, col: 0 | 1) => string {
  const { theme, ctx } = opts;
  const pos = new Map<string, number>();
  ws.getColumn(1).width = 46;
  [2, 3, 4].forEach((c) => (ws.getColumn(c).width = 17));
  const header = ["Concepto", String(opts.years[0]), String(opts.years[1]), "Variación"];
  header.forEach((h, i) => {
    const c = ws.getCell(opts.startRow, i + 1);
    c.value = h;
    styleHeader(c, theme);
  });
  let row = opts.startRow + 1;
  const ref = (key: string, col: 0 | 1) => {
    const r = pos.get(key);
    if (!r) throw new Error(`Línea desconocida: ${key}`);
    return absAddr(2 + col, r);
  };
  for (const line of lines) {
    const label = ws.getCell(row, 1);
    label.value = line.label;
    if (line.kind === "section") {
      ws.mergeCells(row, 1, row, 4);
      label.font = font(theme, { bold: true, color: theme.primaryDark });
      label.fill = solidFill(theme.soft);
      row++;
      continue;
    }
    pos.set(line.key, row);
    for (const col of [0, 1] as const) {
      const c = ws.getCell(row, 2 + col);
      if (line.kind === "input") {
        c.value = opts.example ? line.example[col] : null;
        styleInput(c, theme);
      } else {
        c.value = { formula: line.formula((k) => ref(k, col), col) };
        if (line.emphasis) styleTotal(c, theme);
        else styleCalc(c, theme);
      }
      c.numFmt = line.kind === "calc" && line.percent ? FMT.percent : currencyFormat(ctx);
    }
    const v = ws.getCell(row, 4);
    v.value = { formula: `IFERROR(${absAddr(2, row)}/${absAddr(3, row)}-1,"")` };
    styleCalc(v, theme);
    v.numFmt = FMT.percent;
    if (line.kind === "calc" && line.percent) v.value = null;
    if (line.kind === "calc" && line.emphasis) label.font = font(theme, { bold: true });
    else if (line.kind === "input") label.font = font(theme);
    row++;
  }
  return ref;
}

export const build: TemplateBuild<EstadosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const years: [number, number] = [config.year, config.year - 1];
  const wb = createWorkbook({
    title: titleWith(`Estados financieros ${config.year}`, config.businessName),
    ctx,
    options,
  });
  const er = addSheet(wb, "Estado de resultados", { tabColor: theme.primary });
  const bg = addSheet(wb, "Balance general", { tabColor: theme.primary });
  const ind = addSheet(wb, "Indicadores", { tabColor: theme.primary });
  const ex = config.example;

  addSheetHeader(er, {
    title: titleWith("Estado de resultados", config.businessName),
    subtitle: `Del 1 de enero al 31 de diciembre de ${config.year} (cifras en ${ctx.currency.code})`,
    theme,
    width: 4,
  });
  const R = writeStatement(
    er,
    [
      { kind: "section", label: "Ingresos" },
      { kind: "input", key: "sales", label: "Ventas brutas", example: [2_400_000, 2_050_000] },
      {
        kind: "input",
        key: "returns",
        label: "Devoluciones y descuentos sobre ventas",
        example: [60_000, 45_000],
      },
      {
        kind: "calc",
        key: "netSales",
        label: "Ventas netas",
        formula: (c) => `${c("sales")}-${c("returns")}`,
        emphasis: true,
      },
      { kind: "input", key: "cogs", label: "Costo de ventas", example: [1_440_000, 1_260_000] },
      {
        kind: "calc",
        key: "gross",
        label: "Utilidad bruta",
        formula: (c) => `${c("netSales")}-${c("cogs")}`,
        emphasis: true,
      },
      { kind: "section", label: "Gastos de operación" },
      {
        kind: "input",
        key: "salaries",
        label: "Sueldos y prestaciones",
        example: [360_000, 330_000],
      },
      { kind: "input", key: "rent", label: "Alquileres", example: [96_000, 90_000] },
      {
        kind: "input",
        key: "utilities",
        label: "Servicios públicos y comunicaciones",
        example: [42_000, 39_000],
      },
      { kind: "input", key: "marketing", label: "Publicidad y ventas", example: [30_000, 22_000] },
      { kind: "input", key: "depreciation", label: "Depreciaciones", example: [48_000, 48_000] },
      {
        kind: "input",
        key: "otherOpex",
        label: "Otros gastos de operación",
        example: [54_000, 50_000],
      },
      {
        kind: "calc",
        key: "opex",
        label: "Total gastos de operación",
        formula: (c) =>
          ["salaries", "rent", "utilities", "marketing", "depreciation", "otherOpex"]
            .map(c)
            .join("+"),
        emphasis: true,
      },
      {
        kind: "calc",
        key: "operating",
        label: "Utilidad de operación",
        formula: (c) => `${c("gross")}-${c("opex")}`,
        emphasis: true,
      },
      { kind: "section", label: "Otros ingresos y gastos" },
      { kind: "input", key: "otherIncome", label: "Otros ingresos", example: [12_000, 8_000] },
      {
        kind: "input",
        key: "financial",
        label: "Gastos financieros (intereses y comisiones)",
        example: [36_000, 41_000],
      },
      {
        kind: "calc",
        key: "pretax",
        label: "Utilidad antes de impuestos",
        formula: (c) => `${c("operating")}+${c("otherIncome")}-${c("financial")}`,
        emphasis: true,
      },
      { kind: "input", key: "tax", label: "Impuesto sobre la renta", example: [62_000, 44_000] },
      {
        kind: "calc",
        key: "net",
        label: "UTILIDAD NETA",
        formula: (c) => `${c("pretax")}-${c("tax")}`,
        emphasis: true,
      },
      { kind: "section", label: "Márgenes" },
      {
        kind: "calc",
        key: "grossMargin",
        label: "Margen bruto",
        formula: (c) => `IFERROR(${c("gross")}/${c("netSales")},0)`,
        percent: true,
      },
      {
        kind: "calc",
        key: "opMargin",
        label: "Margen operativo",
        formula: (c) => `IFERROR(${c("operating")}/${c("netSales")},0)`,
        percent: true,
      },
      {
        kind: "calc",
        key: "netMargin",
        label: "Margen neto",
        formula: (c) => `IFERROR(${c("net")}/${c("netSales")},0)`,
        percent: true,
      },
    ],
    { startRow: 4, theme, ctx, years, example: ex },
  );
  const erRef = (key: string, col: 0 | 1) => sheetRef(er.name, R(key, col));

  addSheetHeader(bg, {
    title: titleWith("Balance general", config.businessName),
    subtitle: `Al 31 de diciembre de ${config.year} (cifras en ${ctx.currency.code})`,
    theme,
    width: 4,
  });
  const B = writeStatement(
    bg,
    [
      { kind: "section", label: "Activo corriente" },
      { kind: "input", key: "cash", label: "Caja y bancos", example: [210_000, 150_000] },
      {
        kind: "input",
        key: "receivables",
        label: "Cuentas por cobrar",
        example: [180_000, 160_000],
      },
      { kind: "input", key: "inventory", label: "Inventarios", example: [320_000, 290_000] },
      {
        kind: "input",
        key: "otherCurrent",
        label: "Otros activos corrientes",
        example: [25_000, 20_000],
      },
      {
        kind: "calc",
        key: "currentAssets",
        label: "Total activo corriente",
        formula: (c) => ["cash", "receivables", "inventory", "otherCurrent"].map(c).join("+"),
        emphasis: true,
      },
      { kind: "section", label: "Activo no corriente" },
      {
        kind: "input",
        key: "ppe",
        label: "Propiedad, planta y equipo (costo)",
        example: [520_000, 480_000],
      },
      {
        kind: "input",
        key: "accDep",
        label: "Menos: depreciación acumulada",
        example: [168_000, 120_000],
      },
      {
        kind: "input",
        key: "otherNonCurrent",
        label: "Otros activos no corrientes",
        example: [15_000, 15_000],
      },
      {
        kind: "calc",
        key: "nonCurrentAssets",
        label: "Total activo no corriente",
        formula: (c) => `${c("ppe")}-${c("accDep")}+${c("otherNonCurrent")}`,
        emphasis: true,
      },
      {
        kind: "calc",
        key: "assets",
        label: "TOTAL ACTIVO",
        formula: (c) => `${c("currentAssets")}+${c("nonCurrentAssets")}`,
        emphasis: true,
      },
      { kind: "section", label: "Pasivo" },
      { kind: "input", key: "payables", label: "Proveedores", example: [140_000, 150_000] },
      {
        kind: "input",
        key: "shortDebt",
        label: "Préstamos a corto plazo",
        example: [60_000, 70_000],
      },
      {
        kind: "input",
        key: "taxesPayable",
        label: "Impuestos y retenciones por pagar",
        example: [45_000, 38_000],
      },
      {
        kind: "input",
        key: "otherCurrentLiab",
        label: "Otros pasivos corrientes",
        example: [20_000, 18_000],
      },
      {
        kind: "calc",
        key: "currentLiab",
        label: "Total pasivo corriente",
        formula: (c) =>
          ["payables", "shortDebt", "taxesPayable", "otherCurrentLiab"].map(c).join("+"),
        emphasis: true,
      },
      {
        kind: "input",
        key: "longDebt",
        label: "Préstamos a largo plazo",
        example: [180_000, 240_000],
      },
      {
        kind: "calc",
        key: "liabilities",
        label: "TOTAL PASIVO",
        formula: (c) => `${c("currentLiab")}+${c("longDebt")}`,
        emphasis: true,
      },
      { kind: "section", label: "Patrimonio" },
      { kind: "input", key: "capital", label: "Capital social", example: [300_000, 300_000] },
      {
        kind: "input",
        key: "retained",
        label: "Utilidades retenidas de años anteriores",
        example: [173_000, 90_000],
      },
      {
        kind: "calc",
        key: "yearProfit",
        label: "Utilidad del ejercicio (del estado de resultados)",
        formula: (_c, i) => erRef("net", i),
      },
      {
        kind: "calc",
        key: "equity",
        label: "TOTAL PATRIMONIO",
        formula: (c) => `${c("capital")}+${c("retained")}+${c("yearProfit")}`,
        emphasis: true,
      },
      {
        kind: "calc",
        key: "liabEquity",
        label: "TOTAL PASIVO + PATRIMONIO",
        formula: (c) => `${c("liabilities")}+${c("equity")}`,
        emphasis: true,
      },
      {
        kind: "calc",
        key: "check",
        label: "Diferencia (debe ser cero)",
        formula: (c) => `ROUND(${c("assets")}-${c("liabEquity")},2)`,
      },
    ],
    { startRow: 4, theme, ctx, years, example: ex },
  );
  for (const col of [0, 1] as const) {
    const cell = B("check", col).replace(/\$/g, "");
    highlightWhen(bg, cell, `${cell}<>0`, {
      fill: theme.dangerSoft,
      color: theme.danger,
      bold: true,
    });
    highlightWhen(bg, cell, `${cell}=0`, { fill: theme.okSoft });
  }
  const bgRef = (key: string, col: 0 | 1) => sheetRef(bg.name, B(key, col));

  addSheetHeader(ind, {
    title: "Indicadores financieros",
    subtitle: "Calculados a partir de los estados financieros.",
    theme,
    width: 4,
  });
  ind.getColumn(1).width = 40;
  [2, 3].forEach((c) => (ind.getColumn(c).width = 16));
  ind.getColumn(4).width = 48;
  ["Indicador", String(years[0]), String(years[1]), "Cómo se interpreta"].forEach((h, i) => {
    const c = ind.getCell(4, i + 1);
    c.value = h;
    styleHeader(c, theme);
  });
  const ratios: { label: string; f: (col: 0 | 1) => string; fmt: string; note: string }[] = [
    {
      label: "Razón corriente",
      f: (c) => `IFERROR(${bgRef("currentAssets", c)}/${bgRef("currentLiab", c)},0)`,
      fmt: "0.00",
      note: "Activo corriente por cada lempira de deuda de corto plazo (ideal > 1).",
    },
    {
      label: "Prueba ácida",
      f: (c) =>
        `IFERROR((${bgRef("currentAssets", c)}-${bgRef("inventory", c)})/${bgRef("currentLiab", c)},0)`,
      fmt: "0.00",
      note: "Liquidez sin contar inventario.",
    },
    {
      label: "Endeudamiento",
      f: (c) => `IFERROR(${bgRef("liabilities", c)}/${bgRef("assets", c)},0)`,
      fmt: FMT.percent,
      note: "Parte de los activos financiada con deuda.",
    },
    {
      label: "Capital de trabajo",
      f: (c) => `${bgRef("currentAssets", c)}-${bgRef("currentLiab", c)}`,
      fmt: currencyFormat(ctx),
      note: "Recursos disponibles para operar.",
    },
    {
      label: "Rentabilidad sobre activos (ROA)",
      f: (c) => `IFERROR(${erRef("net", c)}/${bgRef("assets", c)},0)`,
      fmt: FMT.percent,
      note: "Utilidad neta generada por los activos.",
    },
    {
      label: "Rentabilidad sobre patrimonio (ROE)",
      f: (c) => `IFERROR(${erRef("net", c)}/${bgRef("equity", c)},0)`,
      fmt: FMT.percent,
      note: "Utilidad neta para los dueños.",
    },
    {
      label: "Rotación de inventario (veces)",
      f: (c) => `IFERROR(${erRef("cogs", c)}/${bgRef("inventory", c)},0)`,
      fmt: "0.00",
      note: "Cuántas veces se vende el inventario al año.",
    },
  ];
  ratios.forEach((r, i) => {
    const row = 5 + i;
    ind.getCell(row, 1).value = r.label;
    ind.getCell(row, 1).font = font(theme, { bold: true });
    for (const col of [0, 1] as const) {
      const c = ind.getCell(row, 2 + col);
      c.value = { formula: r.f(col) };
      styleCalc(c, theme);
      c.numFmt = r.fmt;
    }
    const n = ind.getCell(row, 4);
    n.value = r.note;
    n.font = font(theme, { size: 9, color: theme.muted });
    n.alignment = { wrapText: true };
  });
  for (const ws of [er, bg, ind]) await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Estado de resultados y balance general",
    description:
      "Prepara tus estados financieros básicos comparando dos años y revisa los principales indicadores.",
    steps: [
      "Escribe en el Estado de resultados las ventas, costos y gastos del año actual y del anterior.",
      "Escribe en el Balance general los saldos de activos, pasivos y capital al cierre de cada año.",
      "La utilidad del ejercicio pasa sola del estado de resultados al balance.",
      "La fila Diferencia debe quedar en cero (verde): si no, revisa tus saldos.",
      "La hoja Indicadores calcula liquidez, endeudamiento y rentabilidad.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
