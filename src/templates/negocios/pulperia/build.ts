import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import { monthDayFormula } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { PulperiaConfig } from "./form";

export const build: TemplateBuild<PulperiaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const { month, year } = config;
  const title = titleWith(`Pulpería — ${periodLabel(month, year)}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Diario", { freezeRows: 10, tabColor: theme.primary, landscape: true });
  const buy = addSheet(wb, "Compras", { freezeRows: 4, tabColor: theme.primary });
  const cred = addSheet(wb, "Fiados", { freezeRows: 4, tabColor: theme.primary });
  const cli = addSheet(wb, "Clientes", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const d = (day: number) => exampleDate(year, month, day);

  // Clientes (los nombres alimentan la lista de Fiados)
  const clientStart = 4;
  const names = `'Clientes'!$A$${clientStart + 1}:$A$${clientStart + config.clients}`;

  addSheetHeader(buy, {
    title: "Compras a proveedores",
    subtitle: "Cada compra con su forma de pago.",
    theme,
    width: 5,
  });
  const purchases = addTable(buy, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "supplier", header: "Proveedor", kind: "text", width: 24 },
      { key: "detail", header: "Detalle", kind: "text", width: 30 },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 15,
        list: ["Efectivo", "Transferencia", "Crédito"],
      },
    ],
    rows: config.purchases,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: d(1),
            supplier: "Distribuidora de abarrotes",
            detail: "Arroz, frijol, azúcar",
            amount: 3500,
            method: "Efectivo",
          },
          {
            date: d(2),
            supplier: "Embotelladora",
            detail: "Gaseosas y agua",
            amount: 2200,
            method: "Crédito",
          },
        ]
      : undefined,
  });

  addSheetHeader(cred, {
    title: "Fiados y abonos",
    subtitle: "Elige el cliente de la lista (agrégalo antes en Clientes).",
    theme,
    width: 5,
  });
  const credits = addTable(cred, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "list", width: 24, list: { source: names } },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 10,
        list: ["Fiado", "Abono"],
        align: "center",
      },
      { key: "detail", header: "Detalle", kind: "text", width: 30 },
      { key: "amount", header: "Monto", kind: "currency", width: 14 },
    ],
    rows: config.credits,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: d(1),
            client: "Doña Rosa Martínez",
            type: "Fiado",
            detail: "Leche, pan y huevos",
            amount: 180,
          },
          {
            date: d(2),
            client: "Don Juan Pérez",
            type: "Fiado",
            detail: "Compra de la semana",
            amount: 650,
          },
          {
            date: d(2),
            client: "Doña Rosa Martínez",
            type: "Abono",
            detail: "Abono en efectivo",
            amount: 100,
          },
        ]
      : undefined,
  });
  const C = (k: string) => credits.sheetRange(k);
  const P = (k: string) => purchases.sheetRange(k);

  addSheetHeader(cli, {
    title: "Clientes con crédito",
    subtitle: "El saldo de cada cliente se calcula con sus fiados y abonos.",
    theme,
    width: 6,
  });
  const clients = addTable(cli, {
    startRow: clientStart,
    columns: [
      { key: "name", header: "Cliente", kind: "text", width: 24 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      { key: "limit", header: "Límite de crédito", kind: "currency", width: 14, fill: 1000 },
      {
        key: "credit",
        header: "Total fiado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${C("amount")},${C("client")},${r.c("name")},${C("type")},"Fiado"))`,
      },
      {
        key: "paid",
        header: "Total abonado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${C("amount")},${C("client")},${r.c("name")},${C("type")},"Abono"))`,
      },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${r.c("credit")}-${r.c("paid")})`,
      },
    ],
    rows: config.clients,
    theme,
    ctx,
    totals: { label: "Total por cobrar" },
    example: ex
      ? [
          { name: "Doña Rosa Martínez", phone: "9876-5432" },
          { name: "Don Juan Pérez", phone: "3344-5566" },
        ]
      : undefined,
  });
  const bal = clients.letter("balance");
  highlightWhen(
    cli,
    `A${clients.firstRow}:${bal}${clients.lastRow}`,
    `AND($A${clients.firstRow}<>"",$${bal}${clients.firstRow}>$C${clients.firstRow})`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );

  // Diario
  addSheetHeader(ws, {
    title,
    subtitle: "Cada noche anota tus ventas y gastos del día. Lo demás se calcula solo.",
    theme,
    width: 11,
  });
  const inputs = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: year },
      { key: "month", label: "Mes (1 a 12)", kind: "integer", value: month },
      {
        key: "margin",
        label: "Margen de ganancia promedio",
        kind: "percent",
        value: config.margin / 100,
      },
    ],
    theme,
    ctx,
  });
  const Y = inputs.cell("year");
  const M = inputs.cell("month");
  const MG = inputs.cell("margin");
  const daily = addTable(ws, {
    startRow: 10,
    columns: [
      {
        key: "date",
        header: "Fecha",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) => monthDayFormula(r.prev("date"), Y, M),
      },
      { key: "cash", header: "Ventas en efectivo", kind: "currency", width: 14, total: "sum" },
      {
        key: "digital",
        header: "Ventas por transferencia",
        kind: "currency",
        width: 14,
        total: "sum",
      },
      {
        key: "credit",
        header: "Fiado del día",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${C("amount")},${C("type")},"Fiado",${C("date")},${r.c("date")}))`,
      },
      {
        key: "sales",
        header: "Ventas totales",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",N(${r.c("cash")})+N(${r.c("digital")})+${r.c("credit")})`,
      },
      {
        key: "payments",
        header: "Abonos recibidos",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${C("amount")},${C("type")},"Abono",${C("date")},${r.c("date")}))`,
      },
      {
        key: "purchases",
        header: "Compras del día",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${P("amount")},${P("date")},${r.c("date")}))`,
      },
      {
        key: "expenses",
        header: "Gastos del día",
        kind: "currency",
        width: 12,
        total: "sum",
        note: "Luz, transporte, bolsas, etc.",
      },
      {
        key: "profit",
        header: "Ganancia estimada",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) =>
          `IF(${r.c("date")}="","",ROUND(${r.c("sales")}*${MG},2)-N(${r.c("expenses")}))`,
      },
      {
        key: "cashBox",
        header: "Efectivo esperado del día",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        allowNegative: true,
        formula: (r) =>
          `IF(${r.c("date")}="","",N(${r.c("cash")})+${r.c("payments")}-SUMIFS(${P("amount")},${P("date")},${r.c("date")},${P("method")},"Efectivo")-N(${r.c("expenses")}))`,
      },
    ],
    rows: 31,
    theme,
    ctx,
    totals: { label: "Total del mes" },
    example: ex
      ? [
          { cash: 4200, digital: 600, expenses: 150 },
          { cash: 3800, digital: 450, expenses: 0 },
          { cash: 5100, digital: 900, expenses: 300 },
        ]
      : undefined,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 5,
    valueCol: 7,
    labelSpan: 2,
    fields: [
      {
        key: "sales",
        label: "Ventas del mes",
        kind: "calc",
        resultKind: "currency",
        formula: () => daily.total("sales"),
      },
      {
        key: "profit",
        label: "Ganancia estimada del mes",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => daily.total("profit"),
      },
      {
        key: "purchases",
        label: "Compras del mes",
        kind: "calc",
        resultKind: "currency",
        formula: () => daily.total("purchases"),
      },
      {
        key: "receivable",
        label: "Fiado pendiente (todos los clientes)",
        kind: "calc",
        resultKind: "currency",
        formula: () => clients.sheetTotal("balance"),
      },
    ],
    theme,
    ctx,
  });
  const pf = daily.letter("profit");
  highlightWhen(
    ws,
    `${pf}${daily.firstRow}:${pf}${daily.lastRow}`,
    `AND(${pf}${daily.firstRow}<>"",${pf}${daily.firstRow}<0)`,
    { color: theme.danger, bold: true },
    1,
  );

  await protectSheet(ws);
  await protectSheet(buy);
  await protectSheet(cred);
  await protectSheet(cli);

  addInstructionsSheet(wb, {
    title: "Control de pulpería",
    description:
      "Todo tu negocio en un archivo: ventas, compras, fiados, ganancia y efectivo en caja.",
    steps: [
      "En Diario confirma el año, el mes y tu margen de ganancia promedio.",
      "Cada noche escribe las ventas en efectivo, las ventas por transferencia y los gastos del día.",
      "Registra las compras a proveedores en Compras y los fiados y abonos en Fiados (agrega antes el cliente en Clientes).",
      "El fiado del día, las compras, la ganancia estimada y el efectivo esperado se calculan solos.",
      "Compara el «Efectivo esperado del día» con lo que cuentas en la gaveta.",
    ],
    tips: [
      "Si no sabes tu margen, empieza con 20 % y ajústalo cuando revises tus precios.",
      "Para el mes siguiente, genera un archivo nuevo o cambia el mes en Diario.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
