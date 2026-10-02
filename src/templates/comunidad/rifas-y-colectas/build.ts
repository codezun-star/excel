import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { RifaConfig } from "./form";

export const build: TemplateBuild<RifaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Rifa y colecta", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const tk = addSheet(wb, "Boletos", { freezeRows: 7, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const don = addSheet(wb, "Donaciones", { freezeRows: 4, tabColor: theme.primary });
  const exp = addSheet(wb, "Gastos", { freezeRows: 4, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "sellers", title: "Vendedores", values: config.sellers, spare: 10 },
    {
      key: "expense",
      title: "Conceptos de gasto",
      values: [
        "Premio",
        "Impresión de boletos",
        "Publicidad",
        "Transporte",
        "Comida y refrigerio",
        "Otros",
      ],
    },
  ]);
  const ex = config.example;
  const seller = (i: number) => config.sellers[i % config.sellers.length]!;
  const first = Number(config.firstNumber);
  const digits = String(first + config.tickets - 1).length;

  addSheetHeader(tk, {
    title,
    subtitle: "Anota el vendedor, el comprador y marca Pagado cuando entreguen el dinero.",
    theme,
    width: 7,
  });
  const top = addFields(tk, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "prize", label: "Premio", kind: "text", value: config.prize },
      { key: "price", label: "Precio por boleto", kind: "currency", value: config.ticketPrice },
      { key: "draw", label: "Fecha del sorteo", kind: "date", value: fromToday(30) },
    ],
    theme,
    ctx,
  });
  const P = top.cell("price");
  const table = addTable(tk, {
    startRow: 7,
    columns: [
      { key: "num", header: "Número", kind: "text", width: 9, align: "center" },
      {
        key: "seller",
        header: "Vendedor",
        kind: "list",
        width: 16,
        list: { source: lists.source("sellers") },
      },
      { key: "buyer", header: "Comprador", kind: "text", width: 26 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      {
        key: "status",
        header: "Pago",
        kind: "list",
        width: 12,
        list: ["Pagado", "Pendiente"],
        align: "center",
      },
      {
        key: "amount",
        header: "Valor",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("buyer")}="","",${P})`,
      },
      {
        key: "paid",
        header: "Cobrado",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("buyer")}="","",IF(${r.c("status")}="Pagado",${r.c("amount")},0))`,
      },
    ],
    rows: config.tickets,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: ex
      ? [
          { seller: seller(0), buyer: "Rosa Hernández", phone: "9876-5432", status: "Pagado" },
          { seller: seller(0), buyer: "Pedro Castillo", status: "Pendiente" },
          {},
          { seller: seller(1), buyer: "Julia Ramos", phone: "3344-5566", status: "Pagado" },
          { seller: seller(2), buyer: "Mario Flores", status: "Pagado" },
        ]
      : undefined,
  });
  const numCol = table.colNumber("num");
  for (let i = 0; i < config.tickets; i++) {
    tk.getCell(table.firstRow + i, numCol).value = String(first + i).padStart(digits, "0");
  }
  const last = table.letter("paid");
  highlightWhen(
    tk,
    `A${table.firstRow}:${last}${table.lastRow}`,
    `AND($C${table.firstRow}<>"",$E${table.firstRow}<>"Pagado")`,
    { fill: theme.dangerSoft },
    1,
  );
  highlightWhen(
    tk,
    `A${table.firstRow}:${last}${table.lastRow}`,
    `AND($C${table.firstRow}<>"",$E${table.firstRow}="Pagado")`,
    { fill: theme.okSoft },
    2,
  );
  const R = (k: string) => table.sheetRange(k);

  addSheetHeader(don, {
    title: "Donaciones",
    subtitle: "Aportes sin boleto: ofrendas, colectas y patrocinios.",
    theme,
    width: 5,
  });
  const dt = addTable(don, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "donor", header: "Donante", kind: "text", width: 26 },
      {
        key: "method",
        header: "Medio",
        kind: "list",
        width: 14,
        list: ["Efectivo", "Transferencia", "Depósito", "En especie"],
      },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "note", header: "Nota", kind: "text", width: 28 },
    ],
    rows: config.donations,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: fromToday(-3),
            donor: "Ferretería El Progreso",
            method: "Transferencia",
            amount: 1000,
            note: "Patrocinio",
          },
        ]
      : undefined,
  });

  addSheetHeader(exp, {
    title: "Gastos de la actividad",
    subtitle: "Premio, impresión de boletos y demás costos.",
    theme,
    width: 5,
  });
  const et = addTable(exp, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "concept",
        header: "Concepto",
        kind: "list",
        width: 20,
        list: { source: lists.source("expense") },
      },
      { key: "detail", header: "Detalle", kind: "text", width: 28 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "receipt", header: "Comprobante", kind: "text", width: 14 },
    ],
    rows: config.expenses,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: fromToday(-10),
            concept: "Impresión de boletos",
            detail: "Talonarios",
            amount: 350,
            receipt: "F-0012",
          },
        ]
      : undefined,
  });

  addSheetHeader(sum, {
    title: "Resumen de la actividad",
    subtitle: "Boletos, cobros, donaciones, gastos y meta.",
    theme,
    width: 5,
  });
  const s = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "goal", label: "Meta a recaudar", kind: "currency", value: config.goal },
      {
        key: "total",
        label: "Boletos disponibles en total",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTA(${R("num")})`,
      },
      {
        key: "sold",
        label: "Boletos vendidos",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${R("buyer")},"<>")`,
      },
      {
        key: "free",
        label: "Boletos sin vender",
        kind: "calc",
        resultKind: "integer",
        formula: (c) => `${c("total")}-${c("sold")}`,
      },
      {
        key: "value",
        label: "Valor de boletos vendidos",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.sheetTotal("amount"),
      },
      {
        key: "paid",
        label: "Cobrado de boletos",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.sheetTotal("paid"),
      },
      {
        key: "pending",
        label: "Pendiente de cobro",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `${c("value")}-${c("paid")}`,
      },
      {
        key: "donations",
        label: "Donaciones",
        kind: "calc",
        resultKind: "currency",
        formula: () => dt.sheetTotal("amount"),
      },
      {
        key: "expenses",
        label: "Gastos",
        kind: "calc",
        resultKind: "currency",
        formula: () => et.sheetTotal("amount"),
      },
      {
        key: "net",
        label: "Ganancia neta (cobrado + donaciones − gastos)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `${c("paid")}+${c("donations")}-${c("expenses")}`,
      },
      {
        key: "progress",
        label: "Avance de la meta",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => `IF(${c("goal")}=0,"",${c("net")}/${c("goal")})`,
      },
      {
        key: "missing",
        label: "Falta para la meta",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `MAX(0,${c("goal")}-${c("net")})`,
      },
    ],
    theme,
    ctx,
  });
  addCategorySummary(sum, {
    startRow: s.nextRow + 2,
    startCol: 1,
    labelHeader: "Vendedor",
    sourceCells: cellsOfRange(lists.source("sellers")),
    values: [
      {
        header: "Boletos",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${R("seller")},${k.labelCell},${R("buyer")},"<>"))`,
      },
      {
        header: "Vendido",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("amount")},${R("seller")},${k.labelCell}))`,
      },
      {
        header: "Cobrado",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("paid")},${R("seller")},${k.labelCell}))`,
      },
      {
        header: "Por cobrar",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("amount")},${R("seller")},${k.labelCell})-SUMIFS(${R("paid")},${R("seller")},${k.labelCell}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 30,
  });

  for (const w of [tk, sum, don, exp]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Rifas y colectas",
    description: "Controla cada boleto, quién lo vendió y si ya está pagado.",
    steps: [
      "En Boletos revisa el premio, el precio y la fecha del sorteo.",
      "Cuando se venda un número escribe el vendedor, el comprador y su teléfono.",
      "Marca Pagado cuando entreguen el dinero; los pendientes se pintan en rojo.",
      "Anota las donaciones y los gastos en sus hojas; el Resumen calcula la ganancia neta, el avance de la meta y lo que debe entregar cada vendedor.",
    ],
    tips: [
      "Si la rifa juega con la lotería, usa 100 boletos con numeración desde 00.",
      "Filtra la columna Pago por Pendiente para cobrar antes del sorteo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
