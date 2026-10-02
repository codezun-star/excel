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

import type { CostosConfig } from "./form";

const MATERIALS: [string, string, string, number, number, number][] = [
  ["Pan de coco (bolsa de 6)", "Harina", "Saco de 50 lb", 50, 800, 10],
  ["Pan de coco (bolsa de 6)", "Coco rallado", "Libra", 1, 60, 3],
  ["Pan de coco (bolsa de 6)", "Azúcar", "Bolsa de 5 lb", 5, 75, 2],
  ["Pan de coco (bolsa de 6)", "Levadura", "Libra", 1, 90, 0.25],
  ["Pan de coco (bolsa de 6)", "Huevos", "Cartón de 30", 30, 135, 6],
  ["Pastel tres leches (porción)", "Harina", "Saco de 50 lb", 50, 800, 2],
  ["Pastel tres leches (porción)", "Leche evaporada y condensada", "Lata", 1, 38, 6],
  ["Pastel tres leches (porción)", "Huevos", "Cartón de 30", 30, 135, 12],
];

export const build: TemplateBuild<CostosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Costos de producto", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const prod = addSheet(wb, "Productos", {
    freezeRows: 7,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const mats = addSheet(wb, "Materiales", { freezeRows: 4, tabColor: theme.primary });
  const ind = addSheet(wb, "Gastos indirectos", { freezeRows: 4, tabColor: theme.primary });
  const params = addParametersSheet(wb, { ctx, theme, sections: [], tables: [salesTaxTable(ctx)] });
  const st = ctx.taxes.salesTax;
  const exempt = st.rates.find((r) => r.rate === 0)?.label ?? st.rates[0]!.label;
  const standard = st.rates.find((r) => r.id === "standard")?.label ?? st.rates[0]!.label;
  const ex = config.example;
  const prodLast = 7 + config.products;
  const prodNames = `'Productos'!$A$8:$A$${prodLast}`;

  // Gastos indirectos del mes
  addSheetHeader(ind, {
    title: "Gastos indirectos del mes",
    subtitle: "Gastos que no son de un producto en particular; se reparten por unidad producida.",
    theme,
    width: 3,
  });
  const it = addTable(ind, {
    startRow: 4,
    columns: [
      { key: "concept", header: "Concepto", kind: "text", width: 30 },
      { key: "amount", header: "Monto mensual", kind: "currency", width: 15, total: "sum" },
    ],
    rows: 20,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          { concept: "Alquiler", amount: 5000 },
          { concept: "Energía eléctrica", amount: 2500 },
          { concept: "Gas", amount: 1500 },
        ]
      : [
          { concept: "Alquiler" },
          { concept: "Energía eléctrica" },
          { concept: "Gas o leña" },
          { concept: "Transporte" },
        ],
  });
  const fi = addFields(ind, {
    startRow: it.totalRow! + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "units",
        label: "Unidades que produces al mes (todas)",
        kind: "number",
        value: ex ? 1500 : undefined,
      },
      {
        key: "perUnit",
        label: "Gasto indirecto por unidad",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `IF(N(${c("units")})=0,0,${it.total("amount")}/${c("units")})`,
      },
    ],
    theme,
    ctx,
  });

  // Materiales por producto
  addSheetHeader(mats, {
    title: "Materiales por producto",
    subtitle: "Escribe cómo lo compras y cuánto usas en un lote de producción.",
    theme,
    width: 8,
  });
  const mt = addTable(mats, {
    startRow: 4,
    columns: [
      { key: "product", header: "Producto", kind: "list", width: 28, list: { source: prodNames } },
      { key: "material", header: "Material o ingrediente", kind: "text", width: 26 },
      { key: "package", header: "Cómo lo compras", kind: "text", width: 16 },
      { key: "packQty", header: "Unidades en el empaque", kind: "number", width: 11 },
      { key: "packPrice", header: "Precio del empaque", kind: "currency", width: 12 },
      {
        key: "unitCost",
        header: "Costo por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("material")}="",N(${r.c("packQty")})=0),"",${r.c("packPrice")}/${r.c("packQty")})`,
      },
      { key: "used", header: "Cantidad usada por lote", kind: "number", width: 11 },
      {
        key: "cost",
        header: "Costo en el lote",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) => `IF(${r.c("unitCost")}="","",${r.c("unitCost")}*N(${r.c("used")}))`,
      },
    ],
    rows: 600,
    theme,
    ctx,
    autoFilter: true,
    headerHeight: 30,
    example: ex
      ? MATERIALS.map(([product, material, pkg, packQty, packPrice, used]) => ({
          product,
          material,
          package: pkg,
          packQty,
          packPrice,
          used,
        }))
      : undefined,
  });
  const M = (k: string) => mt.sheetRange(k);

  // Productos
  addSheetHeader(prod, {
    title,
    subtitle: "Costo real por unidad y precio sugerido. Las celdas blancas son tuyas.",
    theme,
    width: 15,
  });
  const pf = addFields(prod, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "hour", label: "Mano de obra por hora", kind: "currency", value: config.laborHour },
      { key: "margin", label: "Margen deseado", kind: "percent", value: config.margin / 100 },
      {
        key: "overhead",
        label: "Gasto indirecto por unidad",
        kind: "calc",
        resultKind: "currency",
        formula: () => fi.ref("perUnit"),
      },
    ],
    theme,
    ctx,
  });
  prod.getColumn(1).width = 28;
  const H = pf.cell("hour");
  const MG = pf.cell("margin");
  const OH = pf.cell("overhead");
  const pt = addTable(prod, {
    startRow: 7,
    columns: [
      { key: "name", header: "Producto", kind: "text", width: 28 },
      { key: "batch", header: "Unidades por lote", kind: "number", width: 10 },
      {
        key: "materials",
        header: "Materiales del lote",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${M("cost")},${M("product")},${r.c("name")}))`,
      },
      { key: "minutes", header: "Minutos de trabajo por lote", kind: "number", width: 11 },
      {
        key: "labor",
        header: "Mano de obra del lote",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) => `IF(${r.c("name")}="","",N(${r.c("minutes")})/60*${H})`,
      },
      { key: "packaging", header: "Empaque por unidad", kind: "currency", width: 10 },
      {
        key: "cost",
        header: "Costo por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("batch")})=0),"",(${r.c("materials")}+${r.c("labor")})/${r.c("batch")}+N(${r.c("packaging")})+${OH})`,
      },
      {
        key: "suggested",
        header: "Precio sugerido",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) => `IF(OR(${r.c("cost")}="",${MG}>=1),"",${r.c("cost")}/(1-${MG}))`,
      },
      {
        key: "rate",
        header: st.name,
        kind: "list",
        width: 11,
        list: { source: params.tableColumn("salesTax", 0) },
        fill: standard,
      },
      {
        key: "withTax",
        header: `Sugerido con ${st.name}`,
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("suggested")}="","",${r.c("suggested")}*(1+IFERROR(VLOOKUP(${r.c("rate")},${params.table("salesTax")},2,0),0)))`,
      },
      { key: "competitor", header: "Precio de la competencia", kind: "currency", width: 12 },
      { key: "price", header: `Tu precio (con ${st.name})`, kind: "currency", width: 12 },
      {
        key: "net",
        header: `Tu precio sin ${st.name}`,
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(N(${r.c("price")})=0,"",${r.c("price")}/(1+IFERROR(VLOOKUP(${r.c("rate")},${params.table("salesTax")},2,0),0)))`,
      },
      {
        key: "realMargin",
        header: "Margen real",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        allowNegative: true,
        formula: (r) =>
          `IF(OR(${r.c("net")}="",${r.c("cost")}=""),"",(${r.c("net")}-${r.c("cost")})/${r.c("net")})`,
      },
      {
        key: "profit",
        header: "Ganancia por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        allowNegative: true,
        formula: (r) => `IF(${r.c("realMargin")}="","",${r.c("net")}-${r.c("cost")})`,
      },
    ],
    rows: config.products,
    theme,
    ctx,
    headerHeight: 32,
    example: ex
      ? [
          {
            name: "Pan de coco (bolsa de 6)",
            batch: 20,
            minutes: 180,
            packaging: 2,
            rate: exempt,
            competitor: 60,
            price: 60,
          },
          {
            name: "Pastel tres leches (porción)",
            batch: 16,
            minutes: 120,
            packaging: 5,
            rate: standard,
            competitor: 75,
            price: 70,
          },
        ]
      : undefined,
  });
  if (pt.firstRow !== 8 || pt.lastRow !== prodLast)
    throw new Error("Rango de productos inesperado");
  const rm = pt.letter("realMargin");
  highlightWhen(
    prod,
    `${rm}${pt.firstRow}:${rm}${pt.lastRow}`,
    `AND(ISNUMBER(${rm}${pt.firstRow}),${rm}${pt.firstRow}<${MG})`,
    { fill: theme.dangerSoft, bold: true },
    1,
  );
  highlightWhen(
    prod,
    `${rm}${pt.firstRow}:${rm}${pt.lastRow}`,
    `AND(ISNUMBER(${rm}${pt.firstRow}),${rm}${pt.firstRow}>=${MG})`,
    { fill: theme.okSoft, bold: true },
    2,
  );

  for (const w of [prod, mats, ind]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Costos de producto",
    description: "Conoce cuánto te cuesta de verdad cada producto y a cuánto venderlo.",
    steps: [
      "En Productos escribe tus productos y cuántas unidades salen de cada lote.",
      "En Materiales anota cada ingrediente: cómo lo compras, cuántas unidades trae, su precio y cuánto usas por lote.",
      "En Gastos indirectos escribe alquiler, energía, gas y demás, y cuántas unidades produces al mes.",
      "Productos calcula el costo por unidad, el precio sugerido según tu margen y el precio con ISV.",
      "Escribe tu precio actual: el margen real se pinta en rojo si es menor que el deseado.",
    ],
    tips: [
      "Incluye tu propio tiempo como mano de obra, aunque no te pagues sueldo.",
      "Revisa la hoja Parámetros: ahí están las tasas de ISV que usa el archivo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
