import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import { ACCOUNT_TYPES, BASE_ACCOUNTS } from "../shared/accounts";
import type { DiarioConfig } from "./form";

const SPARE_ACCOUNTS = 40;

export const build: TemplateBuild<DiarioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const period = periodLabel(config.month, config.year);
  const wb = createWorkbook({
    title: titleWith(`Libro diario y mayor ${period}`, config.businessName),
    ctx,
    options,
  });
  const journal = addSheet(wb, "Diario", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const ledger = addSheet(wb, "Mayor y balanza", {
    freezeRows: 6,
    landscape: true,
    tabColor: theme.primary,
  });
  const catalogWs = addSheet(wb, "Catálogo", { freezeRows: 4, tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [],
    tables: [
      {
        key: "types",
        title: "Naturaleza por grupo",
        columns: [
          { header: "Primer dígito", kind: "integer" },
          { header: "Tipo", kind: "text" },
          { header: "Naturaleza", kind: "text" },
        ],
        rows: ACCOUNT_TYPES.map((t) => [Number(t.digit), t.type, t.nature]),
      },
    ],
  });
  const types = params.table("types");

  // Catálogo (solo cuentas de mayor y subcuentas: niveles 3 y 4)
  const postable = BASE_ACCOUNTS.filter(([code]) => code.length >= 4);
  addSheetHeader(catalogWs, {
    title: "Catálogo de cuentas",
    subtitle: "Agrega o modifica cuentas aquí.",
    theme,
    width: 3,
  });
  const catalog = addTable(catalogWs, {
    startRow: 4,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 12 },
      { key: "name", header: "Cuenta", kind: "text", width: 40 },
      {
        key: "nature",
        header: "Naturaleza",
        kind: "formula",
        width: 13,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(VLOOKUP(VALUE(LEFT(${r.c("code")},1)),${types},3,0),""))`,
      },
    ],
    rows: postable.length + SPARE_ACCOUNTS,
    theme,
    ctx,
    example: postable.map(([code, name]) => ({ code, name })),
  });

  // Diario
  addSheetHeader(journal, {
    title: titleWith("Libro diario", config.businessName),
    subtitle: `Período: ${period}. Cada partida debe cuadrar: total del debe = total del haber.`,
    theme,
    width: 8,
  });
  const d = (day: number) => exampleDate(config.year, config.month, day);
  const entries = config.example
    ? [
        { n: 1, date: d(1), code: "1103", concept: "Aporte inicial de capital", debit: 100_000 },
        { n: 1, date: d(1), code: "3101", concept: "Aporte inicial de capital", credit: 100_000 },
        { n: 2, date: d(3), code: "1106", concept: "Compra de mercadería", debit: 40_000 },
        { n: 2, date: d(3), code: "1107", concept: "ISV crédito fiscal", debit: 6_000 },
        { n: 2, date: d(3), code: "1103", concept: "Pago con cheque", credit: 46_000 },
        { n: 3, date: d(10), code: "1101", concept: "Venta de contado", debit: 34_500 },
        { n: 3, date: d(10), code: "4101", concept: "Venta de contado", credit: 30_000 },
        { n: 3, date: d(10), code: "2103", concept: "ISV débito fiscal", credit: 4_500 },
      ]
    : undefined;
  const codes = catalog.sheetRange("code");
  const names = catalog.sheetRange("name");
  const table = addTable(journal, {
    startRow: 4,
    columns: [
      { key: "n", header: "Partida", kind: "integer", width: 9, align: "center" },
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "code", header: "Código", kind: "list", width: 11, list: { source: codes } },
      {
        key: "account",
        header: "Cuenta",
        kind: "formula",
        width: 34,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${names},MATCH(${r.c("code")},${codes},0)),"Cuenta no existe"))`,
      },
      { key: "concept", header: "Concepto", kind: "text", width: 34 },
      { key: "debit", header: "Debe", kind: "currency", width: 15, total: "sum" },
      { key: "credit", header: "Haber", kind: "currency", width: 15, total: "sum" },
      {
        key: "check",
        header: "Cuadre de la partida",
        kind: "formula",
        width: 15,
        align: "center",
        formula: (r) =>
          `IF(${r.c("n")}="","",IF(ROUND(SUMIF(${r.col("n")},${r.c("n")},${r.col("debit")})-SUMIF(${r.col("n")},${r.c("n")},${r.col("credit")}),2)=0,"Cuadrada","Descuadrada"))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: entries,
  });
  const chk = `$${table.letter("check")}${table.firstRow}`;
  highlightWhen(journal, `A${table.firstRow}:H${table.lastRow}`, `${chk}="Descuadrada"`, {
    fill: theme.dangerSoft,
    color: theme.danger,
  });
  highlightWhen(
    journal,
    `D${table.firstRow}:D${table.lastRow}`,
    `D${table.firstRow}="Cuenta no existe"`,
    { color: theme.danger, bold: true },
  );

  // Mayor y balanza
  addSheetHeader(ledger, {
    title: "Libro mayor y balanza de comprobación",
    subtitle: `Período: ${period}. Saldos según la naturaleza de cada cuenta.`,
    theme,
    width: 7,
  });
  const totals = addFields(ledger, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "status",
        label: "Balanza",
        kind: "calc",
        emphasis: true,
        formula: () =>
          `IF(ROUND(${table.sheetTotal("debit")}-${table.sheetTotal("credit")},2)=0,"Cuadrada","Descuadrada")`,
      },
    ],
    theme,
    ctx,
  });
  void totals;
  const cat = (key: string, i: number) =>
    sheetRef(catalogWs.name, catalog.cell(key, catalog.firstRow + i, true));
  const mayor = addTable(ledger, {
    startRow: 6,
    columns: [
      {
        key: "code",
        header: "Código",
        kind: "formula",
        width: 11,
        formula: (r) => `IF(${cat("code", r.index)}="","",${cat("code", r.index)})`,
      },
      {
        key: "name",
        header: "Cuenta",
        kind: "formula",
        width: 36,
        formula: (r) => `IF(${r.c("code")}="","",${cat("name", r.index)})`,
      },
      {
        key: "debit",
        header: "Movimientos debe",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("code")}="","",SUMIF(${table.sheetRange("code")},${r.c("code")},${table.sheetRange("debit")}))`,
      },
      {
        key: "credit",
        header: "Movimientos haber",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("code")}="","",SUMIF(${table.sheetRange("code")},${r.c("code")},${table.sheetRange("credit")}))`,
      },
      {
        key: "nature",
        header: "Naturaleza",
        kind: "formula",
        width: 12,
        formula: (r) => `IF(${r.c("code")}="","",${cat("nature", r.index)})`,
      },
      {
        key: "sd",
        header: "Saldo deudor",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) => `IF(${r.c("code")}="","",MAX(0,${r.c("debit")}-${r.c("credit")}))`,
      },
      {
        key: "sa",
        header: "Saldo acreedor",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) => `IF(${r.c("code")}="","",MAX(0,${r.c("credit")}-${r.c("debit")}))`,
      },
    ],
    rows: postable.length + SPARE_ACCOUNTS,
    theme,
    ctx,
    totals: { label: "Totales" },
  });
  void mayor;
  await protectSheet(journal);
  await protectSheet(ledger);

  addInstructionsSheet(wb, {
    title: "Libro diario y mayor",
    description:
      "Registra tus partidas contables y obtén el mayor y la balanza de comprobación automáticamente.",
    steps: [
      "Revisa el Catálogo y agrega las cuentas que necesites.",
      "En el Diario registra cada partida: número, fecha, código de cuenta (lista desplegable), concepto y el monto en Debe o Haber.",
      "Todas las líneas de una misma partida llevan el mismo número; la columna Cuadre indica si la partida cuadra.",
      "La hoja Mayor y balanza suma los movimientos por cuenta y muestra los saldos deudores y acreedores.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
