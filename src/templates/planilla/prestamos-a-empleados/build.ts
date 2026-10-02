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

import type { PrestamosConfig } from "./form";

export const build: TemplateBuild<PrestamosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Préstamos a empleados", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Préstamos", { freezeRows: 9, tabColor: theme.primary, landscape: true });
  const pay = addSheet(wb, "Abonos", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const startRow = 9;
  const firstLoanRow = startRow + 1;
  const lastLoanRow = startRow + config.loans;
  const idRange = `'Préstamos'!$A$${firstLoanRow}:$A$${lastLoanRow}`;
  const empRange = `'Préstamos'!$B$${firstLoanRow}:$B$${lastLoanRow}`;

  addSheetHeader(pay, {
    title: "Abonos",
    subtitle: "Cada descuento en planilla o pago directo, con el número de préstamo.",
    theme,
    width: 5,
  });
  const payments = addTable(pay, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "loan",
        header: "N.º de préstamo",
        kind: "list",
        width: 16,
        list: { source: idRange },
      },
      {
        key: "employee",
        header: "Empleado",
        kind: "formula",
        width: 28,
        formula: (r) =>
          `IF(${r.c("loan")}="","",IFERROR(INDEX(${empRange},MATCH(${r.c("loan")},${idRange},0)),"No existe"))`,
      },
      {
        key: "method",
        header: "Forma",
        kind: "list",
        width: 22,
        list: ["Descuento en planilla", "Pago directo"],
      },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
    ],
    rows: config.payments,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total abonado" },
    example: ex
      ? [
          { date: "2026-01-31", loan: "P-001", method: "Descuento en planilla", amount: 1000 },
          { date: "2026-02-15", loan: "P-002", method: "Descuento en planilla", amount: 2000 },
          { date: "2026-02-28", loan: "P-001", method: "Descuento en planilla", amount: 1000 },
        ]
      : undefined,
  });
  const pLoan = payments.sheetRange("loan");
  const pAmount = payments.sheetRange("amount");

  addSheetHeader(ws, {
    title,
    subtitle: "Préstamos y adelantos: la cuota y el saldo se calculan solos con los abonos.",
    theme,
    width: 10,
  });
  const loans = addTable(ws, {
    startRow,
    columns: [
      {
        key: "id",
        header: "N.º",
        kind: "formula",
        width: 8,
        align: "center",
        formula: (r) => correlativeId("P-", r.c("employee"), r.index),
      },
      { key: "employee", header: "Empleado", kind: "text", width: 28 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 18,
        list: ["Préstamo", "Adelanto de salario"],
      },
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "amount", header: "Monto", kind: "currency", width: 14, total: "sum" },
      {
        key: "installments",
        header: "N.º de cuotas",
        kind: "integer",
        width: 11,
        min: 1,
        align: "center",
      },
      {
        key: "installment",
        header: "Cuota",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("amount")}="",${r.c("installments")}=""),"",ROUND(${r.c("amount")}/MAX(1,${r.c("installments")}),2))`,
      },
      {
        key: "paid",
        header: "Abonado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",SUMIFS(${pAmount},${pLoan},${r.c("id")}))`,
      },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",MAX(0,N(${r.c("amount")})-${r.c("paid")}))`,
      },
      {
        key: "thisMonth",
        header: "Descontar este mes",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("id")}="",${r.c("installment")}=""),"",MIN(${r.c("installment")},${r.c("balance")}))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) => `IF(${r.c("id")}="","",IF(${r.c("balance")}<=0,"Pagado","Activo"))`,
      },
    ],
    rows: config.loans,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            employee: "Ana López",
            type: "Préstamo",
            date: "2026-01-15",
            amount: 6000,
            installments: 6,
          },
          {
            employee: "Carlos Mejía",
            type: "Adelanto de salario",
            date: "2026-02-01",
            amount: 2000,
            installments: 1,
          },
        ]
      : undefined,
  });

  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "active",
        label: "Préstamos activos",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${loans.range("status")},"Activo")`,
      },
      {
        key: "pending",
        label: "Saldo pendiente total",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => loans.total("balance"),
      },
      {
        key: "month",
        label: "A descontar en la próxima planilla",
        kind: "calc",
        resultKind: "currency",
        formula: () => loans.total("thisMonth"),
      },
    ],
    theme,
    ctx,
  });
  const stCol = loans.letter("status");
  highlightWhen(
    ws,
    `A${loans.firstRow}:${stCol}${loans.lastRow}`,
    `$${stCol}${loans.firstRow}="Pagado"`,
    { fill: theme.okSoft },
    1,
  );
  highlightWhen(
    pay,
    `C${payments.firstRow}:C${payments.lastRow}`,
    `C${payments.firstRow}="No existe"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  await protectSheet(ws);
  await protectSheet(pay);

  addInstructionsSheet(wb, {
    title: "Préstamos a empleados",
    description:
      "Controla préstamos y adelantos de salario: cuánto debe cada empleado y cuánto descontar en la planilla.",
    steps: [
      "En Préstamos escribe el empleado, el tipo, la fecha, el monto y el número de cuotas. El número de préstamo (P-001, P-002…) se asigna solo.",
      "Cada vez que descuentes en planilla o el empleado pague, registra el abono en Abonos eligiendo el número de préstamo.",
      "El saldo, el estado y lo que toca descontar este mes se calculan solos.",
      "Copia la columna «Descontar este mes» a tu planilla de sueldos como deducción.",
    ],
    tips: [
      "Un adelanto de salario se registra con 1 cuota y se descuenta completo en la siguiente planilla.",
      "Pide al empleado que firme el acuerdo del préstamo con el monto y las cuotas.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
