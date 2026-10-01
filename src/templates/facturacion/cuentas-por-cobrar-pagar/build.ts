import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet, type ListsRef } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme, type SheetTheme } from "@/lib/excel/styles";
import { addTable, type TableRef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { CuentasConfig } from "./form";

interface Pair {
  label: string;
  docs: TableRef;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function addPair(
  wb: ExcelJS.Workbook,
  opts: {
    kind: "cobrar" | "pagar";
    config: CuentasConfig;
    theme: SheetTheme;
    ctx: CountryContext;
    lists: ListsRef;
  },
): Pair {
  const { theme, ctx, config } = opts;
  const isReceivable = opts.kind === "cobrar";
  const party = isReceivable ? "Cliente" : "Proveedor";
  const docsName = isReceivable ? "Por cobrar" : "Por pagar";
  const payName = isReceivable ? "Cobros" : "Pagos";
  const docsWs = addSheet(wb, docsName, {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const payWs = addSheet(wb, payName, { freezeRows: 4, tabColor: theme.primary });

  addSheetHeader(docsWs, {
    title: titleWith(
      isReceivable ? "Cuentas por cobrar" : "Cuentas por pagar",
      config.businessName,
    ),
    subtitle: `Registra cada documento al crédito. Los ${payName.toLowerCase()} se registran en la hoja ${payName}.`,
    theme,
    width: 11,
  });
  addSheetHeader(payWs, {
    title: payName,
    subtitle: "Cada abono se descuenta automáticamente del documento indicado.",
    theme,
    width: 5,
  });

  // La tabla de abonos se crea primero para conocer sus rangos.
  const payments = addTable(payWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "doc", header: "N.º documento", kind: "text", width: 20 },
      { key: "amount", header: "Monto", kind: "currency", width: 15, total: "sum" },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 16,
        list: { source: opts.lists.source("payment") },
      },
      { key: "note", header: "Nota", kind: "text", width: 30 },
    ],
    rows: config.rows,
    theme,
    ctx,
    example: config.example
      ? [
          {
            date: daysAgo(20),
            doc: isReceivable ? "F-0001" : "C-1001",
            amount: 1500,
            method: config.paymentMethods[0],
          },
          {
            date: daysAgo(5),
            doc: isReceivable ? "F-0002" : "C-1002",
            amount: 3000,
            method: config.paymentMethods[1] ?? config.paymentMethods[0],
          },
        ]
      : undefined,
  });

  const docs = addTable(docsWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "doc", header: "N.º documento", kind: "text", width: 18 },
      { key: "party", header: party, kind: "text", width: 26 },
      { key: "concept", header: "Concepto", kind: "text", width: 26 },
      { key: "amount", header: "Monto", kind: "currency", width: 15, total: "sum" },
      {
        key: "days",
        header: "Días de crédito",
        kind: "integer",
        width: 10,
        fill: config.creditDays,
        align: "center",
      },
      {
        key: "due",
        header: "Vence",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("date")}="",${r.c("days")}=""),"",${r.c("date")}+${r.c("days")})`,
      },
      {
        key: "paid",
        header: "Abonado",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("doc")}="",0,SUMIF(${payments.sheetRange("doc")},${r.c("doc")},${payments.sheetRange("amount")}))`,
      },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) => `IF(${r.c("amount")}="","",${r.c("amount")}-${r.c("paid")})`,
      },
      {
        key: "overdue",
        header: "Días vencido",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("balance")}="",${r.c("due")}=""),"",IF(${r.c("balance")}<=0,0,MAX(0,TODAY()-${r.c("due")})))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("balance")}="","",IF(${r.c("balance")}<=0,"Pagado",IF(${r.c("overdue")}>0,"Vencido","Al día")))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: config.example
      ? [
          {
            date: daysAgo(70),
            doc: isReceivable ? "F-0001" : "C-1001",
            party: isReceivable ? "Ferretería El Clavo" : "Distribuidora Central",
            concept: "Mercadería",
            amount: 4500,
          },
          {
            date: daysAgo(40),
            doc: isReceivable ? "F-0002" : "C-1002",
            party: isReceivable ? "Hotel Las Palmas" : "Lácteos del Valle",
            concept: "Pedido mensual",
            amount: 3000,
          },
          {
            date: daysAgo(10),
            doc: isReceivable ? "F-0003" : "C-1003",
            party: isReceivable ? "Juan Martínez" : "Plásticos HN",
            concept: "Venta al crédito",
            amount: 1250,
          },
        ]
      : undefined,
  });
  const statusRange = `K${docs.firstRow}:K${docs.lastRow}`;
  highlightWhen(docsWs, statusRange, `K${docs.firstRow}="Vencido"`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  highlightWhen(docsWs, statusRange, `K${docs.firstRow}="Pagado"`, { fill: theme.okSoft });
  // En la hoja de abonos se elige el documento de la lista de documentos registrados
  payWs.getColumn(2).width = 20;
  return { label: isReceivable ? "Por cobrar" : "Por pagar", docs };
}

export const build: TemplateBuild<CuentasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Cuentas por cobrar y pagar", config.businessName),
    ctx,
    options,
  });
  const lists = addListsSheet(wb, theme, [
    { key: "payment", title: "Formas de pago", values: config.paymentMethods },
  ]);
  const pairs: Pair[] = [];
  for (const kind of ["cobrar", "pagar"] as const) {
    if (config.include.includes(kind)) pairs.push(addPair(wb, { kind, config, theme, ctx, lists }));
  }

  // --- Antigüedad de saldos -------------------------------------------------
  const aging = addSheet(wb, "Antigüedad", { tabColor: theme.primary });
  addSheetHeader(aging, {
    title: "Antigüedad de saldos",
    subtitle: "Saldos pendientes agrupados por días de atraso (se actualiza con la fecha de hoy).",
    theme,
    width: 1 + pairs.length * 2,
  });
  aging.getColumn(1).width = 26;
  const buckets: { label: string; criteria: (p: Pair) => string }[] = [
    { label: "Al día (sin vencer)", criteria: (p) => `${p.docs.sheetRange("status")},"Al día"` },
    {
      label: "1 a 30 días",
      criteria: (p) =>
        `${p.docs.sheetRange("overdue")},">=1",${p.docs.sheetRange("overdue")},"<=30"`,
    },
    {
      label: "31 a 60 días",
      criteria: (p) =>
        `${p.docs.sheetRange("overdue")},">=31",${p.docs.sheetRange("overdue")},"<=60"`,
    },
    {
      label: "61 a 90 días",
      criteria: (p) =>
        `${p.docs.sheetRange("overdue")},">=61",${p.docs.sheetRange("overdue")},"<=90"`,
    },
    { label: "Más de 90 días", criteria: (p) => `${p.docs.sheetRange("overdue")},">90"` },
  ];
  const agingTable = addTable(aging, {
    startRow: 4,
    columns: [
      { key: "bucket", header: "Antigüedad", kind: "text", width: 26 },
      ...pairs.flatMap((p, i) => [
        {
          key: `amt${i}`,
          header: `Saldo ${p.label.toLowerCase()}`,
          kind: "formula" as const,
          resultKind: "currency" as const,
          width: 18,
          total: "sum" as const,
          formula: (r: { index: number }) =>
            `SUMIFS(${p.docs.sheetRange("balance")},${buckets[r.index]!.criteria(p)})`,
        },
        {
          key: `cnt${i}`,
          header: "Documentos",
          kind: "formula" as const,
          resultKind: "integer" as const,
          width: 12,
          total: "sum" as const,
          formula: (r: { index: number }) =>
            `COUNTIFS(${buckets[r.index]!.criteria(p)},${p.docs.sheetRange("balance")},">0")`,
        },
      ]),
    ],
    rows: buckets.length,
    theme,
    ctx,
    zebra: true,
    totals: { label: "Total pendiente" },
    example: buckets.map((b) => ({ bucket: b.label })),
  });
  for (let r = agingTable.firstRow; r <= agingTable.lastRow; r++) {
    aging.getCell(r, 1).protection = { locked: true };
  }

  for (const p of pairs) await protectSheet(p.docs.ws);
  await protectSheet(aging);

  addInstructionsSheet(wb, {
    title: "Cuentas por cobrar y por pagar",
    description:
      "Controla cuánto te deben tus clientes y cuánto debes a tus proveedores, con vencimientos y antigüedad.",
    steps: [
      "Registra cada factura o documento al crédito en la hoja Por cobrar (clientes) o Por pagar (proveedores).",
      "Ajusta los días de crédito si son distintos; la fecha de vencimiento se calcula sola.",
      "Cada vez que recibas o hagas un pago, regístralo en la hoja Cobros o Pagos con el mismo número de documento.",
      "El saldo, los días vencidos y el estado se actualizan automáticamente.",
      "Revisa la hoja Antigüedad para ver cuánto está vencido por rango de días.",
    ],
    sheets: [
      ...pairs.map((p) => ({
        name: p.label,
        description: "Documentos al crédito con saldo y estado.",
      })),
      { name: "Antigüedad", description: "Saldos pendientes por rango de días vencidos." },
    ],
    tips: [
      "Los documentos vencidos se marcan en rojo y los pagados en verde.",
      "El número de documento del abono debe coincidir exactamente con el del documento.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
