import "server-only";

import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet, salesTaxTable, type ParamsRef } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme, type SheetTheme } from "@/lib/excel/styles";
import { addTable, type CellInput, type ColumnDef, type TableRef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import type { LibroConfig } from "./form";

interface BookRefs {
  table: TableRef;
  taxKeys: { id: string; key: string }[];
}

function addBook(
  ws: ExcelJS.Worksheet,
  opts: {
    party: string;
    title: string;
    config: LibroConfig;
    theme: SheetTheme;
    ctx: CountryContext;
    params: ParamsRef;
    example?: Array<Record<string, CellInput>>;
  },
): BookRefs {
  const { ctx, params, config, theme } = opts;
  const rates = ctx.taxes.salesTax.rates;
  const rateCol = params.tableColumn("salesTax", 1);
  const baseKeys: string[] = [];
  const taxKeys: { id: string; key: string }[] = [];
  const rateColumns: ColumnDef[] = rates.flatMap((rate, i) => {
    const baseKey = `base_${rate.id}`;
    baseKeys.push(baseKey);
    if (rate.rate === 0) {
      return [
        {
          key: baseKey,
          header: `Importe ${rate.label.toLowerCase()}`,
          kind: "currency" as const,
          width: 15,
          total: "sum" as const,
        },
      ];
    }
    const taxKey = `tax_${rate.id}`;
    taxKeys.push({ id: rate.id, key: taxKey });
    return [
      {
        key: baseKey,
        header: `Gravado ${rate.label}`,
        kind: "currency" as const,
        width: 15,
        total: "sum" as const,
      },
      {
        key: taxKey,
        header: rate.label,
        kind: "formula" as const,
        resultKind: "currency" as const,
        width: 13,
        total: "sum" as const,
        formula: (r: { c: (k: string) => string }) =>
          `IF(${r.c(baseKey)}="","",ROUND(${r.c(baseKey)}*INDEX(${rateCol},${i + 1}),2))`,
      },
    ];
  });
  const sumKeys = [...baseKeys, ...taxKeys.map((t) => t.key)];
  const columns: ColumnDef[] = [
    { key: "date", header: "Fecha", kind: "date", width: 12 },
    { key: "doc", header: "N.º factura", kind: "text", width: 22 },
    { key: "party", header: opts.party, kind: "text", width: 26 },
    {
      key: "partyId",
      header: `${ctx.taxId.name} ${opts.party.toLowerCase()}`,
      kind: "text",
      width: 18,
    },
    ...rateColumns,
    {
      key: "total",
      header: "Total",
      kind: "formula",
      resultKind: "currency",
      width: 15,
      total: "sum",
      formula: (r) =>
        `IF(COUNT(${baseKeys.map((k) => r.c(k)).join(",")})=0,"",SUM(${sumKeys.map((k) => r.c(k)).join(",")}))`,
    },
  ];
  addSheetHeader(ws, {
    title: opts.title,
    subtitle: `${config.businessName || "Contribuyente"}${config.taxId ? ` · ${ctx.taxId.name} ${config.taxId}` : ""} · Período: ${periodLabel(config.month, config.year)}`,
    theme,
    width: columns.length,
  });
  const table = addTable(ws, {
    startRow: 4,
    columns,
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales del período" },
    autoFilter: true,
    example: opts.example,
  });
  return { table, taxKeys };
}

export const build: TemplateBuild<LibroConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: `Libro de ventas y compras ${periodLabel(config.month, config.year)}`,
    ctx,
    options,
  });
  const salesWs = addSheet(wb, "Libro de ventas", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const purchasesWs = addSheet(wb, "Libro de compras", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const summaryWs = addSheet(wb, "Resumen ISV", { tabColor: theme.primary });
  const params = addParametersSheet(wb, { ctx, theme, sections: [], tables: [salesTaxTable(ctx)] });

  const d = (day: number) => exampleDate(config.year, config.month, day);
  const ids = ctx.taxes.salesTax.rates.map((r) => r.id);
  const base = (id: string) => `base_${id}`;
  const sales = addBook(salesWs, {
    party: "Cliente",
    title: "Libro de ventas",
    config,
    theme,
    ctx,
    params,
    example: config.example
      ? [
          {
            date: d(3),
            doc: "000-001-01-00000101",
            party: "Consumidor final",
            [base(ids[0]!)]: 8500,
          },
          {
            date: d(9),
            doc: "000-001-01-00000102",
            party: "Bar El Puerto",
            partyId: "0501-1998-004512",
            [base(ids[1] ?? ids[0]!)]: 4200,
          },
          {
            date: d(15),
            doc: "000-001-01-00000103",
            party: "Colegio San José",
            partyId: "0801-2001-112233",
            [base(ids[2] ?? ids[0]!)]: 1300,
          },
        ]
      : undefined,
  });
  const purchases = addBook(purchasesWs, {
    party: "Proveedor",
    title: "Libro de compras",
    config,
    theme,
    ctx,
    params,
    example: config.example
      ? [
          {
            date: d(2),
            doc: "002-001-01-00004512",
            party: "Distribuidora Central",
            partyId: "0801-1995-778899",
            [base(ids[0]!)]: 5200,
          },
          {
            date: d(12),
            doc: "010-002-01-00000877",
            party: "Cervecería Hondureña",
            partyId: "0501-1915-000011",
            [base(ids[1] ?? ids[0]!)]: 2600,
          },
        ]
      : undefined,
  });

  addSheetHeader(summaryWs, {
    title: "Resumen del ISV del período",
    subtitle: periodLabel(config.month, config.year),
    theme,
    width: 3,
  });
  summaryWs.getColumn(1).width = 40;
  summaryWs.getColumn(2).width = 18;
  const rates = ctx.taxes.salesTax.rates.filter((r) => r.rate > 0);
  const fields = addFields(summaryWs, {
    startRow: 4,
    labelCol: 1,
    valueCol: 2,
    fields: [
      ...rates.map((r) => ({
        key: `deb_${r.id}`,
        label: `Débito fiscal ${r.label} (ventas)`,
        kind: "calc" as const,
        resultKind: "currency" as const,
        formula: () => sales.table.sheetTotal(`tax_${r.id}`),
      })),
      {
        key: "debit",
        label: "Total débito fiscal",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => rates.map((r) => ref(`deb_${r.id}`)).join("+") || "0",
      },
      ...rates.map((r) => ({
        key: `cred_${r.id}`,
        label: `Crédito fiscal ${r.label} (compras)`,
        kind: "calc" as const,
        resultKind: "currency" as const,
        formula: () => purchases.table.sheetTotal(`tax_${r.id}`),
      })),
      {
        key: "credit",
        label: "Total crédito fiscal",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => rates.map((r) => ref(`cred_${r.id}`)).join("+") || "0",
      },
      {
        key: "diff",
        label: "Diferencia (débito − crédito)",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `${ref("debit")}-${ref("credit")}`,
      },
      {
        key: "toPay",
        label: `${ctx.taxes.salesTax.name} a pagar`,
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `MAX(0,${ref("diff")})`,
      },
      {
        key: "credit_balance",
        label: "Saldo a favor para el siguiente período",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `MAX(0,-${ref("diff")})`,
      },
      {
        key: "salesTotal",
        label: "Total de ventas del período",
        kind: "calc",
        resultKind: "currency",
        formula: () => sales.table.sheetTotal("total"),
      },
      {
        key: "purchasesTotal",
        label: "Total de compras del período",
        kind: "calc",
        resultKind: "currency",
        formula: () => purchases.table.sheetTotal("total"),
      },
    ],
    theme,
    ctx,
  });
  void fields;
  await protectSheet(salesWs);
  await protectSheet(purchasesWs);
  await protectSheet(summaryWs);

  addInstructionsSheet(wb, {
    title: "Libro de ventas y compras",
    description: `Registro mensual de facturas emitidas y recibidas para calcular el ${ctx.taxes.salesTax.name} del período.`,
    steps: [
      "En Libro de ventas registra cada factura emitida: fecha, número, cliente, RTN y el importe según su tasa (exento, gravado 15 % o 18 %).",
      "En Libro de compras registra cada factura de proveedor con derecho a crédito fiscal.",
      "El ISV de cada línea se calcula con las tasas de la hoja Parámetros.",
      "La hoja Resumen ISV muestra el débito fiscal, el crédito fiscal y el ISV a pagar o saldo a favor.",
      "Usa estos totales como apoyo para tu declaración mensual; confirma los montos con tu contador.",
    ],
    sheets: [
      { name: "Libro de ventas", description: "Facturas emitidas del período." },
      { name: "Libro de compras", description: "Facturas recibidas del período." },
      { name: "Resumen ISV", description: "Débito, crédito e ISV del período." },
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
