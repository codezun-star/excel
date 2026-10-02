import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { DeudasConfig } from "./form";

const TYPES = [
  "Tarjeta de crédito",
  "Préstamo personal",
  "Préstamo de vehículo",
  "Cooperativa",
  "Familiar o amigo",
  "Otro",
];

export const build: TemplateBuild<DeudasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Plan para salir de deudas", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Deudas", { freezeRows: 10, tabColor: theme.primary, landscape: true });
  const ex = config.example;

  addSheetHeader(ws, {
    title,
    subtitle: "Escribe tus deudas con su saldo actual, tasa anual y pago.",
    theme,
    width: 13,
  });
  const settings = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      { key: "extra", label: "Dinero extra al mes", kind: "currency", value: config.extra },
      {
        key: "method",
        label: "Método",
        kind: "list",
        list: ["Bola de nieve", "Avalancha"],
        value: config.method === "snowball" ? "Bola de nieve" : "Avalancha",
      },
    ],
    theme,
    ctx,
  });
  const EXTRA = settings.cell("extra");
  const METHOD = settings.cell("method");
  const table = addTable(ws, {
    startRow: 10,
    columns: [
      { key: "name", header: "Deuda", kind: "text", width: 22 },
      { key: "type", header: "Tipo", kind: "list", width: 18, list: TYPES },
      { key: "balance", header: "Saldo actual", kind: "currency", width: 13, total: "sum" },
      { key: "rate", header: "Tasa anual", kind: "percent", width: 9 },
      { key: "min", header: "Pago mínimo", kind: "currency", width: 12, total: "sum" },
      {
        key: "payment",
        header: "Pago que harás",
        kind: "currency",
        width: 12,
        total: "sum",
        note: "Si lo dejas vacío se usa el pago mínimo.",
      },
      {
        key: "interest",
        header: "Interés del mes",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",ROUND(N(${r.c("balance")})*N(${r.c("rate")})/12,2))`,
      },
      {
        key: "order",
        header: "Orden de pago",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("balance")})<=0),"",IF(${METHOD}="Avalancha",COUNTIFS(${r.col("rate")},">"&N(${r.c("rate")}),${r.col("balance")},">0"),COUNTIFS(${r.col("balance")},"<"&N(${r.c("balance")}),${r.col("balance")},">0"))+1)`,
      },
      {
        key: "plan",
        header: "Pago con extra",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("order")}="","",IF(${r.c("payment")}="",N(${r.c("min")}),${r.c("payment")})+IF(${r.c("order")}=1,N(${EXTRA}),0))`,
      },
      {
        key: "months",
        header: "Meses para pagar",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(${r.c("plan")}="","",IF(${r.c("plan")}<=${r.c("interest")},"No alcanza",IF(N(${r.c("rate")})=0,ROUNDUP(${r.c("balance")}/${r.c("plan")},0),ROUNDUP(NPER(${r.c("rate")}/12,-${r.c("plan")},${r.c("balance")}),0))))`,
      },
      {
        key: "date",
        header: "Libre de esta deuda",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("months")}="",${r.c("months")}="No alcanza"),"",EDATE(TODAY(),${r.c("months")}))`,
      },
      {
        key: "totalInterest",
        header: "Intereses totales",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("months")}="",${r.c("months")}="No alcanza"),"",MAX(0,ROUND(${r.c("plan")}*${r.c("months")}-${r.c("balance")},2)))`,
      },
    ],
    rows: config.debts,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            name: "Tarjeta Banco A",
            type: "Tarjeta de crédito",
            balance: 18000,
            rate: 0.54,
            min: 1200,
          },
          {
            name: "Préstamo cooperativa",
            type: "Cooperativa",
            balance: 45000,
            rate: 0.18,
            min: 2100,
          },
          {
            name: "Tarjeta tienda",
            type: "Tarjeta de crédito",
            balance: 6000,
            rate: 0.6,
            min: 450,
            payment: 600,
          },
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
        key: "debt",
        label: "Deuda total",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("balance"),
      },
      {
        key: "interest",
        label: "Intereses que pagas este mes",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("interest"),
      },
      {
        key: "payments",
        label: "Pago mensual con extra",
        kind: "calc",
        resultKind: "currency",
        formula: () => table.total("plan"),
      },
      {
        key: "free",
        label: "Libre de todas (aprox.)",
        kind: "calc",
        resultKind: "date",
        formula: () => `IF(COUNT(${table.range("date")})=0,"",MAX(${table.range("date")}))`,
      },
    ],
    theme,
    ctx,
  });
  const o = table.letter("order");
  const range = `A${table.firstRow}:${table.letter("totalInterest")}${table.lastRow}`;
  highlightWhen(ws, range, `$${o}${table.firstRow}=1`, { fill: theme.okSoft, bold: true }, 1);
  const m = table.letter("months");
  highlightWhen(
    ws,
    `${m}${table.firstRow}:${m}${table.lastRow}`,
    `${m}${table.firstRow}="No alcanza"`,
    { fill: theme.dangerSoft, color: theme.danger },
    2,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Plan para salir de deudas",
    description: "Ordena tus deudas, conoce cuánto pagas de intereses y cuándo quedarás libre.",
    steps: [
      "Escribe cada deuda con su saldo actual, la tasa de interés anual y el pago mínimo.",
      "Si pagas más que el mínimo, escríbelo en «Pago que harás».",
      "Pon el dinero extra que puedes destinar cada mes y elige el método: bola de nieve o avalancha.",
      "La deuda marcada en verde es la primera: ahí va tu dinero extra. Cuando la termines, ese pago pasa a la siguiente.",
    ],
    tips: [
      "Bola de nieve: motiva porque terminas deudas pequeñas rápido. Avalancha: ahorras más intereses.",
      "Si una deuda dice «No alcanza», tu pago no cubre ni el interés: llama al banco para renegociar.",
      "Las tarjetas suelen cobrar tasas muy altas: revisa tu estado de cuenta para ver la tasa anual.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
