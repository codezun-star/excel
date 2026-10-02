import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet, salesTaxTable } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { PreciosConfig } from "./form";

export const build: TemplateBuild<PreciosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Lista de precios", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Precios", {
    freezeRows: 7,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const params = addParametersSheet(wb, { ctx, theme, sections: [], tables: [salesTaxTable(ctx)] });
  const st = ctx.taxes.salesTax;
  const defaultRate =
    st.rates.find((r) => r.id === config.defaultRate)?.label ?? st.rates[0]?.label;
  addSheetHeader(ws, {
    title: titleWith("Lista de precios", config.businessName),
    subtitle: `Precios con ${st.name} incluido, calculados desde el costo.`,
    theme,
    width: 11,
  });
  const cfg = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "method",
        label: "Método",
        kind: "list",
        list: ["Margen sobre precio", "Recargo sobre costo"],
        value: config.marginMethod === "margen" ? "Margen sobre precio" : "Recargo sobre costo",
      },
      { key: "round", label: "Redondear a múltiplos de", kind: "number", value: config.roundTo },
    ],
    theme,
    ctx,
  });
  const M = cfg.cell("method");
  const R = cfg.cell("round");
  const ex = config.example;
  const table = addTable(ws, {
    startRow: 7,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 11 },
      { key: "name", header: "Producto", kind: "text", width: 30 },
      { key: "cost", header: "Costo (sin ISV)", kind: "currency", width: 13 },
      {
        key: "margin",
        header: "% deseado",
        kind: "percent",
        width: 10,
        fill: config.defaultMargin / 100,
      },
      {
        key: "net",
        header: "Precio sin ISV",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(${r.c("cost")}="","",IF(${M}="Margen sobre precio",IFERROR(${r.c("cost")}/(1-${r.c("margin")}),0),${r.c("cost")}*(1+${r.c("margin")})))`,
      },
      {
        key: "rate",
        header: `Tipo ${st.name}`,
        kind: "list",
        width: 11,
        list: { source: params.tableColumn("salesTax", 0) },
        fill: defaultRate,
      },
      {
        key: "tax",
        header: st.name,
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) =>
          `IF(${r.c("net")}="","",${r.c("net")}*IFERROR(VLOOKUP(${r.c("rate")},${params.table("salesTax")},2,0),0))`,
      },
      {
        key: "gross",
        header: `Precio con ${st.name}`,
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) => `IF(${r.c("net")}="","",${r.c("net")}+${r.c("tax")})`,
      },
      {
        key: "final",
        header: "Precio final",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(${r.c("gross")}="","",IF(${R}>0,ROUNDUP(${r.c("gross")}/${R},0)*${R},ROUND(${r.c("gross")},2)))`,
      },
      {
        key: "profit",
        header: "Ganancia por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(${r.c("final")}="","",${r.c("final")}/(1+IFERROR(VLOOKUP(${r.c("rate")},${params.table("salesTax")},2,0),0))-${r.c("cost")})`,
      },
      {
        key: "real",
        header: "Margen real",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(${r.c("profit")}="","",IFERROR(${r.c("profit")}/(${r.c("profit")}+${r.c("cost")}),0))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            code: "P001",
            name: "Arroz 5 lb",
            cost: 52,
            rate: st.rates.find((r) => r.rate === 0)?.label,
          },
          { code: "P002", name: "Detergente 1 kg", cost: 68 },
          {
            code: "P003",
            name: "Cerveza nacional",
            cost: 22,
            rate: st.rates.find((r) => r.id === "special")?.label,
          },
        ]
      : undefined,
  });
  const p = `${table.letter("profit")}${table.firstRow}`;
  highlightWhen(ws, `${p}:${table.letter("profit")}${table.lastRow}`, `AND(${p}<>"",${p}<0)`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Lista de precios con margen",
    description:
      "Fija precios de venta coherentes con tus costos y el impuesto que corresponde a cada producto.",
    steps: [
      "Elige el método: margen sobre el precio (lo más común en comercio) o recargo sobre el costo.",
      "Escribe el costo sin ISV de cada producto y el porcentaje de ganancia deseado.",
      `Elige la tasa de ${st.name} de cada producto. El precio final se redondea al múltiplo indicado.`,
      "Revisa la ganancia por unidad y el margen real después del redondeo.",
    ],
    tips: [
      "Con margen sobre precio, un 25 % significa que de cada lempira vendido 25 centavos son ganancia.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
