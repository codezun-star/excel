import "server-only";

import { addFields, addSheetHeader, type FieldSpec } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet, salesTaxTable } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import type { DeclaracionIsvConfig } from "./form";

export const build: TemplateBuild<DeclaracionIsvConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const st = ctx.taxes.salesTax;
  const period = periodLabel(config.month, config.year);
  const wb = createWorkbook({
    title: titleWith(`Declaración ${st.name} ${period}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, `Declaración ${st.name}`, {
    showGridLines: false,
    tabColor: theme.primary,
  });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Período y vencimiento",
        rows: [
          { key: "month", label: "Mes del período", value: config.month, kind: "integer" },
          { key: "year", label: "Año del período", value: config.year, kind: "integer" },
          {
            key: "dueDay",
            label: "Día de vencimiento (mes siguiente)",
            value: st.filingDueDay,
            kind: "integer",
          },
        ],
      },
    ],
    tables: [salesTaxTable(ctx)],
  });
  const rateOf = (index: number) => params.tableCell("salesTax", index, 1);
  const rated = st.rates.map((r, i) => ({ ...r, index: i })).filter((r) => r.rate > 0);
  const zero = st.rates.find((r) => r.rate === 0);

  ws.getColumn(1).width = 2;
  ws.getColumn(2).width = 52;
  ws.getColumn(3).width = 20;
  addSheetHeader(ws, {
    title: `Hoja de trabajo — ${st.longName} (${st.name})`,
    subtitle: `${config.businessName || "Contribuyente"}${config.taxId ? ` · ${ctx.taxId.name} ${config.taxId}` : ""} · Período: ${period} · ${st.filingFormName}`,
    theme,
    width: 2,
    startCol: 2,
  });
  const ex = config.example;
  const sales = addFields(ws, {
    startRow: 4,
    labelCol: 2,
    valueCol: 3,
    title: "1. Ventas del período (base imponible)",
    fields: [
      ...rated.map((r, i): FieldSpec => ({
        key: `sales_${r.id}`,
        label: `Ventas gravadas ${r.label}`,
        kind: "currency",
        value: ex ? ([185_000, 42_000][i] ?? 0) : 0,
      })),
      {
        key: "sales_exempt",
        label: `Ventas ${zero ? zero.label.toLowerCase() : "exentas"}`,
        kind: "currency",
        value: ex ? 12_500 : 0,
      },
      { key: "sales_exonerated", label: "Ventas exoneradas", kind: "currency", value: 0 },
      { key: "sales_export", label: "Exportaciones", kind: "currency", value: 0 },
      {
        key: "sales_total",
        label: "Total de ventas",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) =>
          ["sales_exempt", "sales_exonerated", "sales_export", ...rated.map((r) => `sales_${r.id}`)]
            .map((k) => ref(k))
            .join("+"),
      },
    ],
    theme,
    ctx,
  });
  const debit = addFields(ws, {
    startRow: sales.nextRow + 1,
    labelCol: 2,
    valueCol: 3,
    title: "2. Débito fiscal",
    fields: [
      ...rated.map((r): FieldSpec => ({
        key: `debit_${r.id}`,
        label: `${st.name} ${r.label.replace(st.name, "").trim()} sobre ventas`,
        kind: "calc",
        resultKind: "currency",
        formula: () => `ROUND(${sales.cell(`sales_${r.id}`)}*${rateOf(r.index)},2)`,
      })),
      {
        key: "debit_adj",
        label: `Menos: ${st.name} de notas de crédito emitidas`,
        kind: "currency",
        value: ex ? 450 : 0,
      },
      {
        key: "debit_total",
        label: "Total débito fiscal",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${rated.map((r) => ref(`debit_${r.id}`)).join("+")}-${ref("debit_adj")}`,
      },
    ],
    theme,
    ctx,
  });
  const purchases = addFields(ws, {
    startRow: debit.nextRow + 1,
    labelCol: 2,
    valueCol: 3,
    title: "3. Compras con derecho a crédito fiscal (base imponible)",
    fields: [
      ...rated.map((r, i): FieldSpec => ({
        key: `buy_${r.id}`,
        label: `Compras locales gravadas ${r.label}`,
        kind: "currency",
        value: ex ? ([96_000, 21_000][i] ?? 0) : 0,
      })),
      ...rated.map((r, i): FieldSpec => ({
        key: `imp_${r.id}`,
        label: `Importaciones gravadas ${r.label}`,
        kind: "currency",
        value: ex && i === 0 ? 30_000 : 0,
      })),
      {
        key: "buy_exempt",
        label: "Compras exentas (sin crédito fiscal)",
        kind: "currency",
        value: ex ? 8_000 : 0,
      },
    ],
    theme,
    ctx,
  });
  const credit = addFields(ws, {
    startRow: purchases.nextRow + 1,
    labelCol: 2,
    valueCol: 3,
    title: "4. Crédito fiscal",
    fields: [
      ...rated.map((r): FieldSpec => ({
        key: `credit_${r.id}`,
        label: `${st.name} ${r.label.replace(st.name, "").trim()} pagado en compras e importaciones`,
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `ROUND((${purchases.cell(`buy_${r.id}`)}+${purchases.cell(`imp_${r.id}`)})*${rateOf(r.index)},2)`,
      })),
      {
        key: "credit_adj",
        label: `Menos: ${st.name} de notas de crédito recibidas`,
        kind: "currency",
        value: 0,
      },
      {
        key: "credit_total",
        label: "Total crédito fiscal",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) =>
          `${rated.map((r) => ref(`credit_${r.id}`)).join("+")}-${ref("credit_adj")}`,
      },
    ],
    theme,
    ctx,
  });
  const result = addFields(ws, {
    startRow: credit.nextRow + 1,
    labelCol: 2,
    valueCol: 3,
    title: "5. Determinación del impuesto",
    fields: [
      {
        key: "diff",
        label: "Débito fiscal − crédito fiscal",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${debit.cell("debit_total")}-${credit.cell("credit_total")}`,
      },
      {
        key: "prev",
        label: "Menos: saldo a favor del período anterior",
        kind: "currency",
        value: ex ? 1_200 : 0,
      },
      {
        key: "withheld",
        label: `Menos: retenciones de ${st.name} que te efectuaron`,
        kind: "currency",
        value: ex ? 900 : 0,
      },
      {
        key: "net",
        label: "Resultado del período",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `${ref("diff")}-${ref("prev")}-${ref("withheld")}`,
      },
      {
        key: "toPay",
        label: `${st.name} A PAGAR`,
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `MAX(0,${ref("net")})`,
      },
      {
        key: "carry",
        label: "Saldo a favor para el siguiente período",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `MAX(0,-${ref("net")})`,
      },
      {
        key: "due",
        label: "Fecha de vencimiento",
        kind: "calc",
        resultKind: "date",
        formula: () =>
          `WORKDAY(DATE(${params.ref("year")},${params.ref("month")}+1,${params.ref("dueDay")})-1,1)`,
        note: "Si cae en fin de semana se corre al siguiente día hábil (no considera feriados).",
      },
    ],
    theme,
    ctx,
  });
  void result;
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: `Declaración mensual del ${st.name}`,
    description: `Calcula el ${st.name} del mes a partir de tus ventas y compras. Úsala como apoyo para llenar el ${st.filingFormName}.`,
    steps: [
      "Escribe las ventas del período según su tasa (montos sin impuesto). Puedes tomarlas del Libro de ventas.",
      "Escribe las compras e importaciones gravadas que tienen derecho a crédito fiscal.",
      "Agrega los ajustes por notas de crédito, el saldo a favor del mes anterior y las retenciones que te hicieron.",
      `El débito, el crédito y el ${st.name} a pagar (o saldo a favor) se calculan solos con las tasas de Parámetros.`,
      "Revisa la fecha de vencimiento y confirma los valores con tu contador antes de declarar.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
