import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme, styleHeader, styleInput, styleCalc, styleTotal } from "@/lib/excel/styles";
import { addMonthlySummary } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { currencyFormat, FMT } from "@/lib/excel/formats";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { WhatsappConfig } from "./form";

const CHANNELS = ["WhatsApp", "Facebook", "Instagram", "TikTok", "Tienda física", "Otro"];
const METHODS = ["Transferencia", "Contra entrega", "Billetera móvil", "Tarjeta", "Efectivo"];
const SHIPPING = ["Por enviar", "En camino", "Entregado", "Devuelto"];

export const build: TemplateBuild<WhatsappConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith("Ventas por WhatsApp y redes", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Pedidos", { freezeRows: 8, tabColor: theme.primary, landscape: true });
  const cl = addSheet(wb, "Clientes", { freezeRows: 4, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;

  addSheetHeader(ws, {
    title,
    subtitle: "Anota cada pedido apenas te escriban. Marca «Pagado» cuando confirmes el dinero.",
    theme,
    width: 14,
  });
  const orders = addTable(ws, {
    startRow: 8,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "text", width: 22 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      { key: "channel", header: "Canal", kind: "list", width: 13, list: CHANNELS },
      { key: "product", header: "Producto", kind: "text", width: 26 },
      { key: "qty", header: "Cant.", kind: "number", width: 7, align: "center" },
      { key: "price", header: "Precio unitario", kind: "currency", width: 12 },
      { key: "shipping", header: "Envío cobrado", kind: "currency", width: 11 },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("client")}="","",ROUND(N(${r.c("qty")})*N(${r.c("price")})+N(${r.c("shipping")}),2))`,
      },
      { key: "method", header: "Forma de pago", kind: "list", width: 15, list: METHODS },
      {
        key: "paid",
        header: "Pagado",
        kind: "list",
        width: 9,
        list: ["Sí", "No"],
        align: "center",
      },
      { key: "status", header: "Envío", kind: "list", width: 12, list: SHIPPING },
      { key: "city", header: "Ciudad o zona", kind: "text", width: 16 },
      { key: "note", header: "Nota", kind: "text", width: 20 },
    ],
    rows: config.orders,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 5),
            client: "Sofía Aguilar",
            phone: "9911-2233",
            channel: "WhatsApp",
            product: "Blusa floral talla M",
            qty: 2,
            price: 450,
            shipping: 80,
            method: "Transferencia",
            paid: "Sí",
            status: "Entregado",
            city: "Tegucigalpa",
          },
          {
            date: exampleDate(y, 1, 9),
            client: "Daniela Paz",
            phone: "3344-5566",
            channel: "Instagram",
            product: "Bolso de mano",
            qty: 1,
            price: 750,
            shipping: 100,
            method: "Contra entrega",
            paid: "No",
            status: "En camino",
            city: "San Pedro Sula",
          },
          {
            date: exampleDate(y, 2, 2),
            client: "Sofía Aguilar",
            phone: "9911-2233",
            channel: "WhatsApp",
            product: "Vestido casual",
            qty: 1,
            price: 890,
            shipping: 80,
            method: "Transferencia",
            paid: "Sí",
            status: "Entregado",
            city: "Tegucigalpa",
          },
        ]
      : undefined,
  });
  const R = (k: string) => orders.sheetRange(k);
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "sales",
        label: "Ventas registradas",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => orders.total("total"),
      },
      {
        key: "pending",
        label: "Por cobrar",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${orders.range("total")},${orders.range("paid")},"No")`,
      },
      {
        key: "toShip",
        label: "Pedidos por enviar",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${orders.range("status")},"Por enviar")`,
      },
    ],
    theme,
    ctx,
  });
  const pd = orders.letter("paid");
  highlightWhen(
    ws,
    `A${orders.firstRow}:${orders.letter("note")}${orders.lastRow}`,
    `AND($${orders.letter("client")}${orders.firstRow}<>"",$${pd}${orders.firstRow}="No")`,
    { fill: theme.warningSoft },
    1,
  );

  // Clientes
  addSheetHeader(cl, {
    title: "Clientes",
    subtitle: "Escribe el nombre tal como lo anotas en Pedidos para contar sus compras.",
    theme,
    width: 6,
  });
  const clients = addTable(cl, {
    startRow: 4,
    columns: [
      { key: "name", header: "Cliente", kind: "text", width: 24 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      {
        key: "orders",
        header: "Pedidos",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        align: "center",
        formula: (r) => `IF(${r.c("name")}="","",COUNTIF(${R("client")},${r.c("name")}))`,
      },
      {
        key: "spent",
        header: "Total comprado",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${R("total")},${R("client")},${r.c("name")}))`,
      },
      {
        key: "type",
        header: "Tipo",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(${r.c("orders")}>=3,"Frecuente",IF(${r.c("orders")}>=1,"Ocasional","Sin compras")))`,
      },
      { key: "note", header: "Preferencias o tallas", kind: "text", width: 26 },
    ],
    rows: config.clients,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          { name: "Sofía Aguilar", phone: "9911-2233", note: "Talla M, colores claros" },
          { name: "Daniela Paz", phone: "3344-5566" },
        ]
      : undefined,
  });
  const tp = clients.letter("type");
  highlightWhen(
    cl,
    `${tp}${clients.firstRow}:${tp}${clients.lastRow}`,
    `${tp}${clients.firstRow}="Frecuente"`,
    { fill: theme.okSoft, bold: true },
    1,
  );

  // Resumen
  addSheetHeader(sum, {
    title: `Resumen ${y}`,
    subtitle: "Ventas por canal y por mes.",
    theme,
    width: 5,
  });
  const yf = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const Y = yf.cell("year");
  const head = ["Canal", "Pedidos", "Ventas", "Por cobrar"];
  head.forEach((h, i) => {
    const c = sum.getCell(5, i + 1);
    c.value = h;
    styleHeader(c, theme);
  });
  sum.getColumn(1).width = 16;
  [2, 3, 4].forEach((c) => (sum.getColumn(c).width = 14));
  CHANNELS.forEach((ch, i) => {
    const row = 6 + i;
    const a = sum.getCell(row, 1);
    a.value = ch;
    styleInput(a, theme);
    const b = sum.getCell(row, 2);
    b.value = { formula: `COUNTIFS(${R("channel")},A${row},${R("client")},"<>")` };
    b.numFmt = FMT.integer;
    styleCalc(b, theme);
    const c = sum.getCell(row, 3);
    c.value = { formula: `SUMIFS(${R("total")},${R("channel")},A${row})` };
    c.numFmt = currencyFormat(ctx);
    styleCalc(c, theme);
    const d = sum.getCell(row, 4);
    d.value = { formula: `SUMIFS(${R("total")},${R("channel")},A${row},${R("paid")},"No")` };
    d.numFmt = currencyFormat(ctx);
    styleCalc(d, theme);
  });
  const lastCh = 5 + CHANNELS.length;
  const tRow = lastCh + 1;
  const tl = sum.getCell(tRow, 1);
  tl.value = "Total";
  styleTotal(tl, theme);
  [2, 3, 4].forEach((col) => {
    const L = String.fromCharCode(64 + col);
    const c = sum.getCell(tRow, col);
    c.value = { formula: `SUM(${L}6:${L}${lastCh})` };
    c.numFmt = col === 2 ? FMT.integer : currencyFormat(ctx);
    styleTotal(c, theme);
  });
  const inMonth = (s?: string, e?: string) => `${R("date")},">="&${s},${R("date")},"<="&${e}`;
  addMonthlySummary(sum, {
    startRow: tRow + 3,
    startCol: 1,
    yearCell: Y,
    theme,
    ctx,
    values: [
      {
        header: "Pedidos",
        kind: "integer",
        formula: (k) => `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${R("client")},"<>")`,
      },
      {
        header: "Ventas",
        kind: "currency",
        formula: (k) => `SUMIFS(${R("total")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
    ],
  });

  await protectSheet(ws);
  await protectSheet(cl);
  await protectSheet(sum);

  addInstructionsSheet(wb, {
    title: "Ventas por WhatsApp y redes",
    description:
      "Ordena tus ventas por WhatsApp y redes: qué te deben, qué falta enviar y quiénes son tus mejores clientes.",
    steps: [
      "En Pedidos anota fecha, cliente, canal, producto, cantidad, precio y envío. El total se calcula solo.",
      "Marca «Pagado: Sí» cuando confirmes la transferencia o recibas el dinero contra entrega.",
      "Actualiza el estado del envío: Por enviar, En camino, Entregado o Devuelto.",
      "En Clientes escribe el nombre de tus clientes para ver cuántas veces te compran.",
      "En Resumen ves las ventas por canal y por mes.",
    ],
    tips: [
      "Escribe cada cliente siempre igual (mismo nombre) para que sus compras se sumen bien.",
      "Las filas en amarillo son pedidos aún sin pagar.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
