import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { PedidosConfig } from "./form";

const STATES = ["Pendiente", "En proceso", "Listo", "Entregado", "Cancelado"];

function fromToday(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const build: TemplateBuild<PedidosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Pedidos y entregas", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Pedidos", { freezeRows: 9, tabColor: theme.primary, landscape: true });
  const ex = config.example;

  addSheetHeader(ws, {
    title,
    subtitle: "Un pedido por fila. Cambia el estado a «Entregado» cuando el cliente lo reciba.",
    theme,
    width: 13,
  });
  const table = addTable(ws, {
    startRow: 9,
    columns: [
      {
        key: "id",
        header: "Pedido",
        kind: "formula",
        width: 9,
        align: "center",
        formula: (r) => correlativeId("PED-", r.c("client"), r.index),
      },
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "text", width: 24 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      { key: "detail", header: "Detalle del pedido", kind: "text", width: 34, wrap: true },
      { key: "due", header: "Fecha de entrega", kind: "date", width: 12 },
      { key: "total", header: "Total", kind: "currency", width: 13, total: "sum" },
      { key: "advance", header: "Anticipo", kind: "currency", width: 13, total: "sum" },
      { key: "paid", header: "Pagado al entregar", kind: "currency", width: 13, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("client")}="",${r.c("status")}="Cancelado"),"",N(${r.c("total")})-N(${r.c("advance")})-N(${r.c("paid")}))`,
      },
      { key: "status", header: "Estado", kind: "list", width: 13, list: STATES, fill: null },
      {
        key: "days",
        header: "Días para entregar",
        kind: "formula",
        resultKind: "integer",
        width: 11,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("due")}="",${r.c("status")}="Entregado",${r.c("status")}="Cancelado"),"",${r.c("due")}-TODAY())`,
      },
      {
        key: "alert",
        header: "Alerta",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("days")}="","",IF(${r.c("days")}<0,"Atrasado",IF(${r.c("days")}=0,"Para hoy",IF(${r.c("days")}<=2,"Próximo",""))))`,
      },
    ],
    rows: config.orders,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            date: fromToday(-6),
            client: "Lucía Mendoza",
            phone: "9988-7766",
            detail: "Pastel de tres leches para 20 personas",
            due: fromToday(0),
            total: 1200,
            advance: 600,
            status: "Listo",
          },
          {
            date: fromToday(-4),
            client: "Escuela San José",
            phone: "2233-4455",
            detail: "150 baleadas para evento",
            due: fromToday(-1),
            total: 4500,
            advance: 2000,
            status: "En proceso",
          },
          {
            date: fromToday(-10),
            client: "Mario Castillo",
            phone: "3322-1100",
            detail: "Uniforme deportivo (5 piezas)",
            due: fromToday(-3),
            total: 2500,
            advance: 1000,
            paid: 1500,
            status: "Entregado",
          },
        ]
      : undefined,
  });

  const st = table.range("status");
  const al = table.range("alert");
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "pending",
        label: "Pedidos por entregar",
        kind: "calc",
        resultKind: "integer",
        formula: () =>
          `COUNTIF(${st},"Pendiente")+COUNTIF(${st},"En proceso")+COUNTIF(${st},"Listo")`,
      },
      {
        key: "today",
        label: "Para entregar hoy",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${al},"Para hoy")`,
      },
      {
        key: "late",
        label: "Atrasados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${al},"Atrasado")`,
      },
      {
        key: "receivable",
        label: "Total por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("balance"),
      },
    ],
    theme,
    ctx,
  });
  const a = table.letter("alert");
  const range = `A${table.firstRow}:${a}${table.lastRow}`;
  highlightWhen(
    ws,
    range,
    `$${a}${table.firstRow}="Atrasado"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(
    ws,
    range,
    `$${a}${table.firstRow}="Para hoy"`,
    { fill: theme.warningSoft, bold: true },
    2,
  );
  highlightWhen(
    ws,
    range,
    `$${table.letter("status")}${table.firstRow}="Entregado"`,
    { color: theme.muted },
    3,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Pedidos y entregas",
    description:
      "Nunca más olvides un pedido: sabe qué entregar hoy, qué va atrasado y cuánto te deben.",
    steps: [
      "Registra cada pedido con cliente, detalle, fecha de entrega, total y anticipo.",
      "Actualiza el estado: Pendiente → En proceso → Listo → Entregado.",
      "Al entregar, escribe lo que pagó el cliente en «Pagado al entregar».",
      "Las alertas marcan los pedidos para hoy y los atrasados; arriba ves el total por cobrar.",
    ],
    tips: [
      "Pide siempre un anticipo en pedidos especiales para cubrir los materiales.",
      "Filtra la columna Estado para ver solo lo pendiente.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
