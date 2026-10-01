import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { font, makeTheme } from "@/lib/excel/styles";
import { addTable, type CellInput, type TableRef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { ConciliacionConfig } from "./form";

export const build: TemplateBuild<ConciliacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Conciliación bancaria", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Conciliación", { tabColor: theme.primary });
  [14, 18, 32, 16, 3, 40, 18].forEach((w, i) => (ws.getColumn(i + 1).width = w));
  addSheetHeader(ws, {
    title: titleWith("Conciliación bancaria", config.businessName),
    subtitle:
      [config.bank, config.account ? `Cuenta ${config.account}` : ""].filter(Boolean).join(" · ") ||
      "Banco y cuenta",
    theme,
    width: 7,
  });
  const ex = config.example;
  const head = addFields(ws, {
    startRow: 4,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      { key: "date", label: "Fecha de corte", kind: "date", value: ex ? "2026-03-31" : null },
      {
        key: "bank",
        label: "Saldo según estado de cuenta del banco",
        kind: "currency",
        value: ex ? 158_430 : 0,
      },
      {
        key: "books",
        label: "Saldo según libros (registros contables)",
        kind: "currency",
        value: ex ? 145_985 : 0,
      },
    ],
    theme,
    ctx,
  });

  let row = head.nextRow + 1;
  const section = (
    title: string,
    party: string,
    example?: Record<string, CellInput>[],
    allowNegative = false,
  ): TableRef => {
    const t = ws.getCell(row, 1);
    t.value = title;
    t.font = font(theme, { bold: true, color: theme.primaryDark });
    row++;
    const ref = addTable(ws, {
      startRow: row,
      columns: [
        { key: "date", header: "Fecha", kind: "date", width: 14 },
        { key: "ref", header: "Referencia / N.º", kind: "text", width: 18 },
        { key: "detail", header: party, kind: "text", width: 32 },
        {
          key: "amount",
          header: "Monto",
          kind: "currency",
          width: 16,
          total: "sum",
          allowNegative,
        },
      ],
      rows: config.rows,
      theme,
      ctx,
      totals: { label: `Total ${title.toLowerCase()}` },
      example,
    });
    row = (ref.totalRow ?? ref.lastRow) + 2;
    return ref;
  };
  const deposits = section(
    "Depósitos en tránsito",
    "Descripción",
    ex
      ? [{ date: "2026-03-31", ref: "DEP-0331", detail: "Ventas del 31 de marzo", amount: 12_500 }]
      : undefined,
  );
  const checks = section(
    "Cheques en circulación",
    "Beneficiario",
    ex
      ? [
          { date: "2026-03-28", ref: "CH-1045", detail: "Distribuidora Central", amount: 18_200 },
          { date: "2026-03-30", ref: "CH-1046", detail: "Alquiler de local", amount: 6_500 },
        ]
      : undefined,
  );
  const bankErrors = section("Ajustes por errores del banco (+/−)", "Descripción", undefined, true);
  const debits = section(
    "Notas de débito del banco no registradas",
    "Concepto",
    ex
      ? [{ date: "2026-03-31", ref: "ND", detail: "Comisión por manejo de cuenta", amount: 175 }]
      : undefined,
  );
  const credits = section(
    "Notas de crédito del banco no registradas",
    "Concepto",
    ex ? [{ date: "2026-03-31", ref: "NC", detail: "Intereses ganados", amount: 420 }] : undefined,
  );
  const bookErrors = section("Ajustes por errores en libros (+/−)", "Descripción", undefined, true);

  const result = addFields(ws, {
    startRow: 4,
    labelCol: 6,
    valueCol: 7,
    title: "Resultado de la conciliación",
    fields: [
      {
        key: "bankAdj",
        label: "Saldo del banco conciliado",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `${head.cell("bank")}+${deposits.total("amount")}-${checks.total("amount")}+${bankErrors.total("amount")}`,
      },
      {
        key: "booksAdj",
        label: "Saldo en libros conciliado",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `${head.cell("books")}+${credits.total("amount")}-${debits.total("amount")}+${bookErrors.total("amount")}`,
      },
      {
        key: "diff",
        label: "Diferencia",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => `ROUND(${r("bankAdj")}-${r("booksAdj")},2)`,
      },
      {
        key: "status",
        label: "Estado",
        kind: "calc",
        emphasis: true,
        formula: (r) => `IF(${r("diff")}=0,"Conciliado","Revisar diferencia")`,
      },
    ],
    theme,
    ctx,
  });
  const st = result.cell("status").replace(/\$/g, "");
  highlightWhen(ws, st, `${result.cell("status")}="Conciliado"`, {
    fill: theme.okSoft,
    bold: true,
  });
  highlightWhen(ws, st, `${result.cell("status")}<>"Conciliado"`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Conciliación bancaria",
    description: "Compara el saldo del banco con el de tus registros y explica cada diferencia.",
    steps: [
      "Escribe la fecha de corte, el saldo del estado de cuenta y el saldo de tus libros.",
      "Anota los depósitos que hiciste pero el banco aún no refleja (en tránsito) y los cheques emitidos que no se han cobrado.",
      "Anota los cargos (notas de débito) y abonos (notas de crédito) del banco que aún no registraste en libros.",
      "Si encontraste errores, regístralos como ajustes positivos o negativos.",
      "Cuando la diferencia sea cero, la conciliación queda en verde. Registra en libros las notas pendientes.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
