import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { addFields, type FieldsRef } from "@/lib/excel/blocks";
import type { SheetTheme } from "@/lib/excel/styles";
import { addTable, type TableRef } from "@/lib/excel/table";

/**
 * Tabla de amortización con cuota nivelada (sistema francés) o capital
 * constante, seguro mensual y abono extra opcionales. Las filas posteriores
 * al plazo o a la cancelación quedan vacías.
 */
export interface AmortizationOptions {
  startRow: number;
  maxRows: number;
  theme: SheetTheme;
  ctx: CountryContext;
  values: {
    amount: number;
    annualRate: number;
    months: number;
    firstPayment: string | null;
    insurance?: number;
    extra?: number;
    method: "nivelada" | "capital-constante";
  };
  labels?: { amount?: string };
  includeInsurance?: boolean;
  includeExtra?: boolean;
}

export interface AmortizationRef {
  inputs: FieldsRef;
  summary: FieldsRef;
  table: TableRef;
}

export function addAmortization(ws: ExcelJS.Worksheet, opts: AmortizationOptions): AmortizationRef {
  const { theme, ctx, values } = opts;
  const inputs = addFields(ws, {
    startRow: opts.startRow,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    title: "Datos del préstamo",
    fields: [
      {
        key: "amount",
        label: opts.labels?.amount ?? "Monto del préstamo",
        kind: "currency",
        value: values.amount,
      },
      { key: "rate", label: "Tasa de interés anual", kind: "percent", value: values.annualRate },
      { key: "months", label: "Plazo (meses)", kind: "integer", value: values.months },
      { key: "first", label: "Fecha del primer pago", kind: "date", value: values.firstPayment },
      {
        key: "method",
        label: "Tipo de cuota",
        kind: "list",
        list: ["Nivelada", "Capital constante"],
        value: values.method === "nivelada" ? "Nivelada" : "Capital constante",
      },
      ...(opts.includeInsurance
        ? [
            {
              key: "insurance",
              label: "Seguros y cargos mensuales",
              kind: "currency" as const,
              value: values.insurance ?? 0,
            },
          ]
        : []),
      ...(opts.includeExtra
        ? [
            {
              key: "extra",
              label: "Abono extra a capital cada mes",
              kind: "currency" as const,
              value: values.extra ?? 0,
            },
          ]
        : []),
    ],
    theme,
    ctx,
  });
  const I = inputs.cell;
  const monthlyRate = `${I("rate")}/12`;
  const summary = addFields(ws, {
    startRow: opts.startRow,
    labelCol: 5,
    valueCol: 7,
    labelSpan: 2,
    title: "Resumen",
    fields: [
      {
        key: "payment",
        label: "Cuota mensual (capital + interés)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () =>
          `IF(${I("method")}="Nivelada",IF(${monthlyRate}=0,${I("amount")}/${I("months")},PMT(${monthlyRate},${I("months")},-${I("amount")})),${I("amount")}/${I("months")}+${I("amount")}*${monthlyRate})`,
        note: "Con capital constante es la primera cuota (las siguientes bajan).",
      },
      ...(opts.includeInsurance
        ? [
            {
              key: "total",
              label: "Pago mensual total con seguros",
              kind: "calc" as const,
              resultKind: "currency" as const,
              formula: (r: (k: string) => string) => `${r("payment")}+${I("insurance")}`,
            },
          ]
        : []),
      {
        key: "interest",
        label: "Total de intereses",
        kind: "calc",
        resultKind: "currency",
        formula: () => "0",
      },
      {
        key: "paid",
        label: "Total pagado (capital + intereses)",
        kind: "calc",
        resultKind: "currency",
        formula: () => "0",
      },
      {
        key: "count",
        label: "Número de cuotas pagadas",
        kind: "calc",
        resultKind: "integer",
        formula: () => "0",
      },
      {
        key: "end",
        label: "Fecha del último pago",
        kind: "calc",
        resultKind: "date",
        formula: () => "0",
      },
    ],
    theme,
    ctx,
  });
  const S = summary.cell;
  const extra = opts.includeExtra ? `+${I("extra")}` : "";
  const table = addTable(ws, {
    startRow: Math.max(inputs.nextRow, summary.nextRow) + 1,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 7,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.index + 1}>${I("months")},${r.prev("end") ? `N(${r.prev("end")})<=0.005` : "0"}),"",${r.index + 1})`,
      },
      {
        key: "date",
        header: "Fecha",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("n")}="",${I("first")}=""),"",EDATE(${I("first")},${r.index}))`,
      },
      {
        key: "start",
        header: "Saldo inicial",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) => `IF(${r.c("n")}="","",${r.prev("end") ?? I("amount")})`,
      },
      {
        key: "interest",
        header: "Interés",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("n")}="","",ROUND(${r.c("start")}*${monthlyRate},2))`,
      },
      {
        key: "capital",
        header: "Abono a capital",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("n")}="","",IF(${r.c("n")}=${I("months")},${r.c("start")},MIN(${r.c("start")},IF(${I("method")}="Nivelada",ROUND(${S("payment")}-${r.c("interest")},2),ROUND(${I("amount")}/${I("months")},2))${extra})))`,
      },
      {
        key: "payment",
        header: "Cuota",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("n")}="","",${r.c("capital")}+${r.c("interest")})`,
      },
      ...(opts.includeInsurance
        ? [
            {
              key: "insurance",
              header: "Seguros",
              kind: "formula" as const,
              resultKind: "currency" as const,
              width: 12,
              total: "sum" as const,
              formula: (r: { c: (k: string) => string }) =>
                `IF(${r.c("n")}="","",${I("insurance")})`,
            },
          ]
        : []),
      {
        key: "end",
        header: "Saldo final",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) => `IF(${r.c("n")}="","",ROUND(${r.c("start")}-${r.c("capital")},2))`,
      },
    ],
    rows: opts.maxRows,
    theme,
    ctx,
    totals: { label: "Totales" },
  });
  ws.getCell(S("interest")).value = { formula: table.total("interest") };
  ws.getCell(S("paid")).value = { formula: `${table.total("interest")}+${table.total("capital")}` };
  ws.getCell(S("count")).value = { formula: `COUNT(${table.range("n")})` };
  ws.getCell(S("end")).value = {
    formula: `IF(OR(${S("count")}=0,${I("first")}=""),"",EDATE(${I("first")},${S("count")}-1))`,
  };
  return { inputs, summary, table };
}
