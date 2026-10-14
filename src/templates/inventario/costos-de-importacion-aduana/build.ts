import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet, salesTaxTable } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { font, makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { ImportacionConfig } from "./form";

const BY_VALUE = "Valor FOB";
const BY_WEIGHT = "Peso";

export const build: TemplateBuild<ImportacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const cu = ctx.taxes.customs;
  const st = ctx.taxes.salesTax;
  const duty = cu.dutyName;
  const title = titleWith("Costos de importación", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Importación", {
    freezeRows: 13,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const summary = addSheet(wb, "Liquidación", { showGridLines: false, tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [],
    tables: [
      salesTaxTable(ctx),
      {
        key: "duty",
        title: `Tasas comunes del ${duty} (${cu.dutyLongName})`,
        columns: [{ header: `Tasa ${duty}`, kind: "percent" }],
        rows: cu.dutyRates.map((r) => [r]),
        note: `La tasa exacta depende de la partida arancelaria de cada producto: confírmala con tu agente aduanero. El ${st.name} de importación se calcula sobre el valor ${cu.valuationBasis} más el ${duty} y el selectivo.`,
      },
    ],
  });
  const standard = st.rates.find((r) => r.id === "standard") ?? st.rates[0];
  const exempt = st.rates.find((r) => r.rate === 0);
  const rateOf = (pick: number) => cu.dutyRates[Math.min(pick, cu.dutyRates.length - 1)] ?? 0;

  addSheetHeader(ws, {
    title,
    subtitle: `Valor ${cu.valuationBasis} = FOB + flete + seguro. ${duty} sobre el ${cu.valuationBasis}; ${st.name} sobre ${cu.valuationBasis} + ${duty} + selectivo.`,
    theme,
    width: 14,
  });
  const ex = config.example;
  const info = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    valueSpan: 2,
    title: "Datos de la importación",
    fields: [
      {
        key: "supplier",
        label: "Proveedor",
        kind: "text",
        value: ex ? "Shenzhen Tools Co." : null,
      },
      {
        key: "invoice",
        label: "Factura comercial",
        kind: "text",
        value: ex ? "INV-0451" : null,
      },
      { key: "origin", label: "País de origen", kind: "text", value: ex ? "China" : null },
      {
        key: "date",
        label: "Fecha de llegada",
        kind: "date",
        value: ex ? fromToday(-5) : null,
      },
      {
        key: "declaration",
        label: "N.º de declaración aduanera",
        kind: "text",
        value: ex ? "DUCA-F 000123" : null,
      },
      {
        key: "rate",
        label: "Tipo de cambio (L por US$)",
        kind: "number",
        value: config.exchangeRate,
      },
      {
        key: "method",
        label: "Prorratear gastos por",
        kind: "list",
        list: [BY_VALUE, BY_WEIGHT],
        value: BY_VALUE,
      },
      {
        key: "recover",
        label: `¿Recuperas el ${st.name} como crédito fiscal?`,
        kind: "list",
        list: ["Sí", "No"],
        value: "Sí",
        note: `Si estás inscrito en el ${st.name}, lo pagado en aduana se descuenta en tu declaración y no forma parte del costo.`,
      },
    ],
    theme,
    ctx,
  });
  const freight = addFields(ws, {
    startRow: 3,
    labelCol: 6,
    valueCol: 9,
    labelSpan: 3,
    title: "Gastos hasta el puerto (US$)",
    fields: [
      { key: "freight", label: "Flete internacional", kind: "usd", value: ex ? 800 : 0 },
      { key: "insurance", label: "Seguro", kind: "usd", value: ex ? 100 : 0 },
      { key: "other", label: "Otros gastos en origen", kind: "usd", value: ex ? 100 : 0 },
      {
        key: "totalUsd",
        label: "Total en dólares",
        kind: "calc",
        resultKind: "usd",
        formula: (ref) => `${ref("freight")}+${ref("insurance")}+${ref("other")}`,
      },
      {
        key: "totalL",
        label: "Total en lempiras",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `ROUND(${ref("totalUsd")}*${info.cell("rate")},2)`,
      },
    ],
    theme,
    ctx,
  });
  const local = addFields(ws, {
    startRow: 3,
    labelCol: 11,
    valueCol: 14,
    labelSpan: 3,
    title: "Gastos locales (L)",
    fields: [
      { key: "agent", label: "Agente aduanero", kind: "currency", value: ex ? 6_000 : 0 },
      {
        key: "port",
        label: "Almacenaje y manejo en puerto",
        kind: "currency",
        value: ex ? 2_500 : 0,
      },
      {
        key: "transport",
        label: "Transporte hasta tu bodega",
        kind: "currency",
        value: ex ? 3_500 : 0,
      },
      { key: "bank", label: "Gastos bancarios", kind: "currency", value: ex ? 500 : 0 },
      { key: "other", label: "Otros gastos", kind: "currency", value: 0 },
      {
        key: "total",
        label: "Total gastos locales",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) =>
          ["agent", "port", "transport", "bank", "other"].map((k) => ref(k)).join("+"),
      },
    ],
    theme,
    ctx,
  });
  const RATE = info.cell("rate");
  const METHOD = info.cell("method");
  const RECOVER = info.cell("recover");

  const tableTitle = ws.getCell(12, 1);
  tableTitle.value = "Productos de la importación";
  tableTitle.font = font(theme, { bold: true, color: theme.primaryDark });
  const table = addTable(ws, {
    startRow: 13,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 10 },
      { key: "desc", header: "Descripción", kind: "text", width: 26 },
      { key: "hs", header: "Partida arancelaria", kind: "text", width: 12 },
      { key: "qty", header: "Cantidad", kind: "number", width: 10, total: "sum" },
      { key: "weight", header: "Peso total (kg)", kind: "number", width: 10, total: "sum" },
      { key: "fobUnit", header: "FOB unitario (US$)", kind: "usd", width: 12 },
      {
        key: "fobUsd",
        header: "FOB total (US$)",
        kind: "formula",
        resultKind: "usd",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("qty")}="",${r.c("fobUnit")}=""),"",ROUND(${r.c("qty")}*${r.c("fobUnit")},2))`,
      },
      {
        key: "share",
        header: "Participación",
        kind: "formula",
        resultKind: "percent",
        width: 11,
        total: "sum",
        note: "Parte de los gastos que le toca a cada producto, según su valor FOB o su peso.",
        formula: (r) =>
          `IF(${r.c("fobUsd")}="","",IFERROR(IF(${METHOD}="${BY_WEIGHT}",N(${r.c("weight")})/SUM(${r.col("weight")}),${r.c("fobUsd")}/SUM(${r.col("fobUsd")})),0))`,
      },
      {
        key: "fobL",
        header: "FOB (L)",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("fobUsd")}="","",ROUND(${r.c("fobUsd")}*${RATE},2))`,
      },
      {
        key: "freight",
        header: "Flete y seguro (L)",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("share")}="","",ROUND(${r.c("share")}*${freight.cell("totalL")},2))`,
      },
      {
        key: "cif",
        header: `Valor ${cu.valuationBasis} (L)`,
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("fobL")}="","",${r.c("fobL")}+${r.c("freight")})`,
      },
      {
        key: "dutyRate",
        header: `${duty} %`,
        kind: "percent",
        width: 8,
        note: `Tasa del ${duty} según la partida arancelaria (ver tasas comunes en Parámetros).`,
      },
      {
        key: "duty",
        header: `${duty} (L)`,
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("cif")}="","",ROUND(${r.c("cif")}*N(${r.c("dutyRate")}),2))`,
      },
      {
        key: "selRate",
        header: "Selectivo %",
        kind: "percent",
        width: 9,
        note: `Solo productos gravados con el ${cu.selectiveTaxName}.`,
      },
      {
        key: "sel",
        header: "Selectivo (L)",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("cif")}="","",ROUND((${r.c("cif")}+${r.c("duty")})*N(${r.c("selRate")}),2))`,
      },
      {
        key: "taxType",
        header: st.name,
        kind: "list",
        width: 10,
        list: { source: params.tableColumn("salesTax", 0) },
        fill: standard?.label,
      },
      {
        key: "tax",
        header: `${st.name} (L)`,
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("cif")}="","",ROUND((${r.c("cif")}+${r.c("duty")}+${r.c("sel")})*IFERROR(VLOOKUP(${r.c("taxType")},${params.table("salesTax")},2,0),0),2))`,
      },
      {
        key: "local",
        header: "Gastos locales (L)",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("share")}="","",ROUND(${r.c("share")}*${local.cell("total")},2))`,
      },
      {
        key: "total",
        header: "Costo en bodega (L)",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("cif")}="","",${r.c("cif")}+${r.c("duty")}+${r.c("sel")}+IF(${RECOVER}="Sí",0,${r.c("tax")})+${r.c("local")})`,
      },
      {
        key: "unitCost",
        header: "Costo unitario (L)",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("total")}="","",IFERROR(ROUND(${r.c("total")}/${r.c("qty")},2),""))`,
      },
      {
        key: "margin",
        header: "Margen deseado",
        kind: "percent",
        width: 9,
        note: "Margen sobre el precio de venta (30 % = de cada L 100 vendidos, L 30 son ganancia).",
      },
      {
        key: "price",
        header: `Precio sugerido (sin ${st.name})`,
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("unitCost")}="",${r.c("margin")}=""),"",IFERROR(ROUND(${r.c("unitCost")}/(1-${r.c("margin")}),2),""))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    headerHeight: 40,
    example: ex
      ? [
          {
            code: "TAL-01",
            desc: "Taladro inalámbrico 20 V",
            hs: "8467.21.00",
            qty: 50,
            weight: 100,
            fobUnit: 60,
            dutyRate: rateOf(2),
            margin: 0.35,
          },
          {
            code: "BRO-01",
            desc: "Juego de brocas para metal",
            hs: "8207.50.00",
            qty: 200,
            weight: 40,
            fobUnit: 5,
            dutyRate: rateOf(3),
            margin: 0.4,
          },
          {
            code: "CAS-01",
            desc: "Casco de seguridad",
            hs: "6506.10.00",
            qty: 100,
            weight: 60,
            fobUnit: 10,
            dutyRate: rateOf(1),
            taxType: exempt?.label ?? standard?.label,
            margin: 0.3,
          },
        ]
      : undefined,
  });
  await protectSheet(ws);

  // Liquidación de la importación
  summary.getColumn(1).width = 2;
  summary.getColumn(2).width = 50;
  summary.getColumn(3).width = 20;
  addSheetHeader(summary, {
    title: "Liquidación de la importación",
    subtitle: "Se calcula con la hoja Importación.",
    theme,
    width: 2,
    startCol: 2,
  });
  const T = (key: string) => table.sheetTotal(key);
  addFields(summary, {
    startRow: 4,
    labelCol: 2,
    valueCol: 3,
    title: "Resumen",
    fields: [
      {
        key: "fobUsd",
        label: "Valor FOB (US$)",
        kind: "calc",
        resultKind: "usd",
        formula: () => T("fobUsd"),
      },
      {
        key: "rate",
        label: "Tipo de cambio",
        kind: "calc",
        resultKind: "number",
        formula: () => info.ref("rate"),
      },
      {
        key: "fobL",
        label: "Valor FOB (L)",
        kind: "calc",
        resultKind: "currency",
        formula: () => T("fobL"),
      },
      {
        key: "freight",
        label: "Flete, seguro y gastos en origen (L)",
        kind: "calc",
        resultKind: "currency",
        formula: () => T("freight"),
      },
      {
        key: "cif",
        label: `Valor ${cu.valuationBasis} (L)`,
        kind: "calc",
        resultKind: "currency",
        formula: () => T("cif"),
      },
      {
        key: "duty",
        label: `${duty} (L)`,
        kind: "calc",
        resultKind: "currency",
        formula: () => T("duty"),
      },
      {
        key: "sel",
        label: `${cu.selectiveTaxName} (L)`,
        kind: "calc",
        resultKind: "currency",
        formula: () => T("sel"),
      },
      {
        key: "tax",
        label: `${st.name} de importación (L)`,
        kind: "calc",
        resultKind: "currency",
        formula: () => T("tax"),
      },
      {
        key: "customs",
        label: "TOTAL DE IMPUESTOS A PAGAR EN ADUANA",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${ref("duty")}+${ref("sel")}+${ref("tax")}`,
      },
      {
        key: "local",
        label: "Gastos locales (L)",
        kind: "calc",
        resultKind: "currency",
        formula: () => T("local"),
      },
      {
        key: "cash",
        label: "Dinero total que sale de tu caja",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `${ref("fobL")}+${ref("freight")}+${ref("customs")}+${ref("local")}`,
      },
      {
        key: "credit",
        label: `Crédito fiscal de ${st.name} (lo recuperas)`,
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `IF(${info.ref("recover")}="Sí",${ref("tax")},0)`,
      },
      {
        key: "cost",
        label: "COSTO TOTAL PUESTO EN BODEGA",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => T("total"),
      },
      {
        key: "factor",
        label: "Factor de importación",
        kind: "calc",
        resultKind: "number",
        note: "Por cada lempira de mercadería (FOB), cuánto te cuesta puesta en tu bodega.",
        formula: (ref) => `IFERROR(${ref("cost")}/${ref("fobL")},0)`,
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(summary);

  addInstructionsSheet(wb, {
    title: "Costos de importación y aduana",
    description:
      "Conoce cuánto te cuesta realmente cada producto importado puesto en tu bodega y cuánto pagarás en aduana.",
    steps: [
      "Escribe los datos de la importación, el tipo de cambio y cómo quieres repartir los gastos (por valor FOB o por peso).",
      "Anota el flete, el seguro y los gastos en origen en dólares, y los gastos locales en lempiras (agente aduanero, puerto, transporte).",
      `Registra cada producto: cantidad, peso, precio FOB unitario en dólares y la tasa del ${duty} de su partida arancelaria.`,
      `Si el producto paga selectivo, escribe su tasa; elige si el ${st.name} es ${standard?.label ?? "gravado"} o ${exempt?.label ?? "exento"}.`,
      "El valor CIF, los impuestos, los gastos prorrateados y el costo unitario se calculan solos; escribe tu margen para ver el precio sugerido.",
      "La hoja Liquidación resume lo que pagas en aduana, el crédito fiscal y el costo total.",
    ],
    sheets: [
      { name: "Importación", description: "Datos, gastos y costo por producto." },
      { name: "Liquidación", description: "Totales de la importación y factor de importación." },
      { name: "Parámetros", description: `Tasas del ${st.name} y tasas comunes del ${duty}.` },
    ],
    tips: [
      "Usa un archivo por importación (o duplica la hoja) para conservar el costo de cada compra.",
      "El factor de importación te sirve para estimar compras futuras: costo en bodega ≈ FOB en lempiras × factor.",
      `Confirma con tu agente aduanero la partida arancelaria, la tasa del ${duty} y el tipo de cambio de la declaración.`,
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
