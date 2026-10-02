import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId, fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { TallerConfig } from "./form";

const STATES = [
  "Recibido",
  "En diagnóstico",
  "Esperando repuestos",
  "En reparación",
  "Listo",
  "Entregado",
];

export const build: TemplateBuild<TallerConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Órdenes de trabajo", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Órdenes", { freezeRows: 9, tabColor: theme.primary, landscape: true });
  const rp = addSheet(wb, "Repuestos", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const tax = ctx.taxes.salesTax;
  const stdRate = tax.rates.find((r) => r.id === "standard")?.rate ?? 0;
  const startRow = 9;
  const idRange = `'Órdenes'!$A$${startRow + 1}:$A$${startRow + config.orders}`;

  addSheetHeader(rp, {
    title: "Repuestos por orden",
    subtitle: "Elige el número de orden y anota cada repuesto usado.",
    theme,
    width: 6,
  });
  const parts = addTable(rp, {
    startRow: 4,
    columns: [
      { key: "order", header: "Orden", kind: "list", width: 12, list: { source: idRange } },
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "part", header: "Repuesto", kind: "text", width: 30 },
      { key: "qty", header: "Cantidad", kind: "number", width: 10 },
      { key: "price", header: "Precio unitario", kind: "currency", width: 13 },
      {
        key: "subtotal",
        header: "Subtotal",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("order")}="","",ROUND(N(${r.c("qty")})*N(${r.c("price")}),2))`,
      },
    ],
    rows: config.parts,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total repuestos" },
    example: ex
      ? [
          {
            order: "OT-001",
            date: fromToday(-2),
            part: "Aceite 15W-40 (galón)",
            qty: 1,
            price: 650,
          },
          { order: "OT-001", date: fromToday(-2), part: "Filtro de aceite", qty: 1, price: 180 },
          {
            order: "OT-002",
            date: fromToday(-1),
            part: "Pastillas de freno delanteras",
            qty: 1,
            price: 900,
          },
        ]
      : undefined,
  });
  const pOrder = parts.sheetRange("order");
  const pSub = parts.sheetRange("subtotal");

  addSheetHeader(ws, {
    title,
    subtitle: "Una orden por vehículo. Actualiza el estado hasta «Entregado».",
    theme,
    width: 16,
  });
  const settings = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "rate",
        label: `${tax.name} (${config.chargeTax ? "se cobra" : "no se cobra"})`,
        kind: "percent",
        value: config.chargeTax ? stdRate : 0,
        note: "Pon 0 % si no cobras impuesto en las órdenes.",
      },
    ],
    theme,
    ctx,
  });
  const RATE = settings.cell("rate");
  const orders = addTable(ws, {
    startRow,
    columns: [
      {
        key: "id",
        header: "Orden",
        kind: "formula",
        width: 9,
        align: "center",
        formula: (r) => correlativeId("OT-", r.c("client"), r.index),
      },
      { key: "date", header: "Ingreso", kind: "date", width: 11 },
      { key: "client", header: "Cliente", kind: "text", width: 22 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      { key: "vehicle", header: "Vehículo", kind: "text", width: 18 },
      { key: "plate", header: "Placa", kind: "text", width: 10 },
      { key: "km", header: "Km", kind: "integer", width: 9 },
      { key: "job", header: "Trabajo solicitado", kind: "text", width: 30, wrap: true },
      { key: "labor", header: "Mano de obra", kind: "currency", width: 12, total: "sum" },
      {
        key: "parts",
        header: "Repuestos",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",SUMIFS(${pSub},${pOrder},${r.c("id")}))`,
      },
      {
        key: "tax",
        header: tax.name,
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("id")}="","",ROUND((N(${r.c("labor")})+${r.c("parts")})*${RATE},2))`,
      },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",N(${r.c("labor")})+${r.c("parts")}+${r.c("tax")})`,
      },
      { key: "advance", header: "Anticipo y pagos", kind: "currency", width: 12, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",${r.c("total")}-N(${r.c("advance")}))`,
      },
      { key: "status", header: "Estado", kind: "list", width: 17, list: STATES },
      { key: "delivered", header: "Entrega", kind: "date", width: 11 },
    ],
    rows: config.orders,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            date: fromToday(-2),
            client: "Roberto Sánchez",
            phone: "9900-1122",
            vehicle: "Toyota Hilux 2018",
            plate: "HBA 1234",
            km: 85400,
            job: "Cambio de aceite y revisión general",
            labor: 400,
            advance: 500,
            status: "Listo",
          },
          {
            date: fromToday(-1),
            client: "Marta Zelaya",
            phone: "3311-4455",
            vehicle: "Nissan Sentra 2015",
            plate: "PCD 5678",
            km: 120300,
            job: "Cambio de frenos delanteros",
            labor: 600,
            status: "En reparación",
          },
        ]
      : undefined,
  });

  const st = orders.range("status");
  addFields(ws, {
    startRow: 3,
    labelCol: 6,
    valueCol: 8,
    labelSpan: 2,
    fields: [
      {
        key: "inShop",
        label: "Vehículos en el taller",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTA(${orders.range("client")})-COUNTIF(${st},"Entregado")`,
      },
      {
        key: "ready",
        label: "Listos para entregar",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${st},"Listo")`,
      },
      {
        key: "receivable",
        label: "Saldo por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => orders.total("balance"),
      },
      {
        key: "labor",
        label: "Mano de obra facturada",
        kind: "calc",
        resultKind: "currency",
        formula: () => orders.total("labor"),
      },
    ],
    theme,
    ctx,
  });
  const s = orders.letter("status");
  const range = `A${orders.firstRow}:${orders.letter("delivered")}${orders.lastRow}`;
  highlightWhen(
    ws,
    range,
    `$${s}${orders.firstRow}="Listo"`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    ws,
    range,
    `$${s}${orders.firstRow}="Esperando repuestos"`,
    { fill: theme.warningSoft },
    2,
  );
  highlightWhen(ws, range, `$${s}${orders.firstRow}="Entregado"`, { color: theme.muted }, 3);
  await protectSheet(ws);
  await protectSheet(rp);

  addInstructionsSheet(wb, {
    title: "Control de taller mecánico",
    description:
      "Órdenes de trabajo claras: qué se le hizo a cada vehículo, cuánto cuesta y cuánto falta cobrar.",
    steps: [
      "Al recibir un vehículo, escribe cliente, vehículo, placa, kilometraje y el trabajo solicitado. El número de orden se asigna solo.",
      "Anota cada repuesto en Repuestos eligiendo el número de orden.",
      "Escribe la mano de obra y los anticipos o pagos; el total, el impuesto y el saldo se calculan solos.",
      "Cambia el estado conforme avanza la reparación y escribe la fecha de entrega.",
    ],
    tips: [
      `El ${tax.name} usa la tasa de la celda superior; ponla en 0 % si no lo cobras.`,
      "Antes de empezar, confirma el presupuesto con el cliente y registra el anticipo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
