import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { offsetCell, offsetRange } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import {
  addCategorySummary,
  addMonthlySummary,
  cellsOfRange,
  ifLabel,
  type SummaryValue,
} from "@/lib/excel/summary";
import { addTable, blankUnlessAll, type ColumnDef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ReporteVentasConfig } from "./form";

export const build: TemplateBuild<ReporteVentasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Reporte de ventas", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Ventas", { freezeRows: 4, tabColor: theme.primary, landscape: true });
  const summary = addSheet(wb, "Resumen", { tabColor: theme.primary });

  const lists = addListsSheet(wb, theme, [
    { key: "categories", title: "Categorías", values: config.categories },
    { key: "payment", title: "Formas de pago", values: config.paymentMethods },
    ...(config.includeSeller
      ? [{ key: "sellers", title: "Vendedores", values: config.sellers }]
      : []),
  ]);

  const columns: ColumnDef[] = [
    { key: "date", header: "Fecha", kind: "date", width: 12 },
    ...(config.includeInvoice
      ? [{ key: "invoice", header: "N.º factura", kind: "text" as const, width: 18 }]
      : []),
    { key: "client", header: "Cliente", kind: "text", width: 24 },
    { key: "product", header: "Producto o servicio", kind: "text", width: 30 },
    {
      key: "category",
      header: "Categoría",
      kind: "list",
      width: 16,
      list: { source: lists.source("categories") },
    },
    { key: "qty", header: "Cantidad", kind: "number", width: 10 },
    { key: "price", header: "Precio unitario", kind: "currency", width: 15 },
    {
      key: "total",
      header: "Total",
      kind: "formula",
      resultKind: "currency",
      width: 15,
      formula: (r) =>
        blankUnlessAll([r.c("qty"), r.c("price")], `ROUND(${r.c("qty")}*${r.c("price")},2)`),
    },
    {
      key: "payment",
      header: "Forma de pago",
      kind: "list",
      width: 16,
      list: { source: lists.source("payment") },
    },
    ...(config.includeSeller
      ? [
          {
            key: "seller",
            header: "Vendedor",
            kind: "list" as const,
            width: 16,
            list: { source: lists.source("sellers") },
          },
        ]
      : []),
  ];

  addSheetHeader(ws, {
    title: titleWith("Registro de ventas", config.businessName),
    subtitle: "Escribe una venta por fila. Los totales y el resumen se calculan automáticamente.",
    theme,
    width: columns.length,
  });

  const y = config.year;
  const cat = (i: number) => config.categories[i % Math.max(1, config.categories.length)] ?? "";
  const pay = (i: number) =>
    config.paymentMethods[i % Math.max(1, config.paymentMethods.length)] ?? "";
  const example = config.example
    ? [
        {
          date: exampleDate(y, 1, 5),
          invoice: "000-001-01-00000001",
          client: "Consumidor final",
          product: "Arroz 5 lb",
          category: cat(0),
          qty: 4,
          price: 62,
          payment: pay(0),
          seller: config.sellers[0],
        },
        {
          date: exampleDate(y, 1, 5),
          invoice: "000-001-01-00000002",
          client: "María López",
          product: "Gaseosa 2 L",
          category: cat(1),
          qty: 6,
          price: 48,
          payment: pay(1),
          seller: config.sellers[1] ?? config.sellers[0],
        },
        {
          date: exampleDate(y, 2, 12),
          invoice: "000-001-01-00000003",
          client: "Consumidor final",
          product: "Leche entera",
          category: cat(2),
          qty: 10,
          price: 32,
          payment: pay(0),
          seller: config.sellers[0],
        },
        {
          date: exampleDate(y, 3, 3),
          invoice: "000-001-01-00000004",
          client: "Hotel El Puerto",
          product: "Detergente 1 kg",
          category: cat(3),
          qty: 12,
          price: 85,
          payment: pay(2),
          seller: config.sellers[0],
        },
        {
          date: exampleDate(y, 3, 20),
          invoice: "000-001-01-00000005",
          client: "Consumidor final",
          product: "Frijoles 2 lb",
          category: cat(0),
          qty: 5,
          price: 40,
          payment: pay(0),
          seller: config.sellers[1] ?? config.sellers[0],
        },
      ]
    : undefined;

  const table = addTable(ws, {
    startRow: 4,
    columns,
    rows: config.rows,
    theme,
    ctx,
    example,
    autoFilter: true,
  });

  // --- Resumen ------------------------------------------------------------
  summary.getColumn(1).width = 2;
  addSheetHeader(summary, {
    title: titleWith("Resumen de ventas", config.businessName),
    subtitle: "Cambia el año para ver otro período.",
    theme,
    width: 8,
    startCol: 2,
  });
  const fields = addFields(summary, {
    startRow: 4,
    labelCol: 2,
    valueCol: 3,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: config.year },
      {
        key: "total",
        label: "Ventas del año",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) =>
          `SUMIFS(${table.sheetRange("total")},${table.sheetRange("date")},">="&DATE(${ref("year")},1,1),${table.sheetRange("date")},"<="&DATE(${ref("year")},12,31))`,
      },
    ],
    theme,
    ctx,
  });
  const yearCell = fields.cell("year");
  const totalYear = fields.cell("total");
  const inMonth = (start?: string, end?: string) =>
    `${table.sheetRange("date")},">="&${start},${table.sheetRange("date")},"<="&${end}`;
  const inYear = `${table.sheetRange("date")},">="&DATE(${yearCell},1,1),${table.sheetRange("date")},"<="&DATE(${yearCell},12,31)`;

  const monthly = addMonthlySummary(summary, {
    startRow: 8,
    startCol: 2,
    yearCell,
    theme,
    ctx,
    values: [
      {
        header: "Ventas",
        kind: "currency",
        formula: (k) => `SUMIFS(${table.sheetRange("total")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "N.º de ventas",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${table.sheetRange("total")},">0")`,
      },
      {
        header: "Ticket promedio",
        kind: "currency",
        formula: (k) => `IFERROR(${offsetCell(k.labelCell, 1)}/${offsetCell(k.labelCell, 2)},0)`,
        total: (rng) => `IFERROR(SUM(${offsetRange(rng, -2)})/SUM(${offsetRange(rng, -1)}),0)`,
      },
    ],
  });

  let nextRow = monthly.totalRow + 2;
  const byGroup = (header: string, key: string, sourceKey: string): void => {
    const values: SummaryValue[] = [
      {
        header: "Ventas",
        kind: "currency",
        formula: (k) =>
          ifLabel(
            k,
            `SUMIFS(${table.sheetRange("total")},${table.sheetRange(key)},${k.labelCell},${inYear})`,
          ),
      },
      {
        header: "% del total",
        kind: "percent",
        formula: (k) => ifLabel(k, `IFERROR(${offsetCell(k.labelCell, 1)}/${totalYear},0)`),
      },
    ];
    const ref = addCategorySummary(summary, {
      startRow: nextRow,
      startCol: 2,
      labelHeader: header,
      sourceCells: cellsOfRange(lists.source(sourceKey)),
      values,
      theme,
      ctx,
    });
    nextRow = ref.totalRow + 2;
  };
  byGroup("Categoría", "category", "categories");
  byGroup("Forma de pago", "payment", "payment");
  if (config.includeSeller) byGroup("Vendedor", "seller", "sellers");

  await protectSheet(summary);

  addInstructionsSheet(wb, {
    title: "Reporte de ventas",
    description:
      "Lleva el control de tus ventas diarias y obtén reportes por mes, categoría y forma de pago sin hacer cuentas.",
    steps: [
      "En la hoja Ventas registra cada venta: fecha, cliente, producto, categoría, cantidad y precio unitario.",
      "El total de cada venta se calcula solo.",
      "En la hoja Resumen escribe el año que quieres revisar: verás ventas por mes, ticket promedio y totales por categoría y forma de pago.",
      "Agrega o cambia categorías, formas de pago y vendedores en la hoja Listas.",
    ],
    sheets: [
      { name: "Ventas", description: "Registro de cada venta (con filtros en el encabezado)." },
      { name: "Resumen", description: "Totales por mes, categoría, forma de pago y vendedor." },
      { name: "Listas", description: "Opciones de las listas desplegables." },
    ],
    tips: ["Usa los filtros del encabezado para ver las ventas de un cliente o producto."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
