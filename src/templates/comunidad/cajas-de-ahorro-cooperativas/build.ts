import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { rangeAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { CajaRuralConfig } from "./form";

export const build: TemplateBuild<CajaRuralConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const wb = createWorkbook({
    title: titleWith(`Caja de ahorro ${y}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Aportes", {
    freezeRows: 4,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const loansWs = addSheet(wb, "Préstamos", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const summary = addSheet(wb, "Resumen y utilidades", { tabColor: theme.primary });
  const ex = config.example;
  const c = config.contribution;

  addSheetHeader(ws, {
    title: titleWith(`Aportes ${y}`, config.businessName),
    subtitle: "Monto ahorrado por cada socio en cada mes.",
    theme,
    width: 15,
  });
  const aportes = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "name", header: "Socio", kind: "text", width: 26 },
      ...SHORT_MONTHS.map((m, i) => ({
        key: `m${i}`,
        header: m,
        kind: "currency" as const,
        width: 9,
        total: "sum" as const,
      })),
      {
        key: "total",
        header: "Total ahorrado",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",SUM(${r.c("m0")}:${r.c("m11")}))`,
      },
    ],
    rows: config.members,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          { name: "María Hernández", m0: c, m1: c, m2: c },
          { name: "José Martínez", m0: c, m1: c, m2: c * 2 },
          { name: "Rosa Aguilar", m0: c, m1: c },
        ]
      : undefined,
  });
  const names = sheetRef(ws.name, rangeAddr(1, aportes.firstRow, 1, aportes.lastRow, true));

  addSheetHeader(loansWs, {
    title: "Préstamos a socios",
    subtitle: "Cuota nivelada con interés mensual.",
    theme,
    width: 10,
  });
  const loans = addTable(loansWs, {
    startRow: 4,
    columns: [
      { key: "member", header: "Socio", kind: "list", width: 24, list: { source: names } },
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "amount", header: "Monto prestado", kind: "currency", width: 14, total: "sum" },
      {
        key: "rate",
        header: "Interés mensual",
        kind: "percent",
        width: 11,
        fill: config.monthlyRate / 100,
      },
      { key: "months", header: "Plazo (meses)", kind: "integer", width: 10 },
      {
        key: "payment",
        header: "Cuota mensual",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("amount")}="",${r.c("months")}=""),"",IF(${r.c("rate")}=0,${r.c("amount")}/${r.c("months")},PMT(${r.c("rate")},${r.c("months")},-${r.c("amount")})))`,
      },
      {
        key: "toPay",
        header: "Total a pagar",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("payment")}="","",ROUND(${r.c("payment")}*${r.c("months")},2))`,
      },
      {
        key: "interest",
        header: "Intereses",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("toPay")}="","",${r.c("toPay")}-${r.c("amount")})`,
      },
      { key: "paid", header: "Abonado", kind: "currency", width: 13, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("toPay")}="","",MAX(0,${r.c("toPay")}-${r.c("paid")}))`,
      },
    ],
    rows: 150,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            member: "José Martínez",
            date: exampleDate(y, 2, 15),
            amount: 1000,
            months: 5,
            paid: 432.8,
          },
        ]
      : undefined,
  });

  addSheetHeader(summary, { title: `Resumen de la caja ${y}`, theme, width: 4 });
  summary.getColumn(1).width = 44;
  const res = addFields(summary, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "saved",
        label: "Total ahorrado por los socios",
        kind: "calc",
        resultKind: "currency",
        formula: () => aportes.sheetTotal("total"),
      },
      {
        key: "lent",
        label: "Total prestado",
        kind: "calc",
        resultKind: "currency",
        formula: () => loans.sheetTotal("amount"),
      },
      {
        key: "repaid",
        label: "Total abonado a préstamos",
        kind: "calc",
        resultKind: "currency",
        formula: () => loans.sheetTotal("paid"),
      },
      {
        key: "cash",
        label: "Fondos disponibles (ahorros − prestado + abonado)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => `${r("saved")}-${r("lent")}+${r("repaid")}`,
      },
      {
        key: "expected",
        label: "Intereses por cobrar en total",
        kind: "calc",
        resultKind: "currency",
        formula: () => loans.sheetTotal("interest"),
      },
      {
        key: "profit",
        label: "Utilidades a repartir (escribe el monto)",
        kind: "currency",
        value: ex ? 300 : 0,
      },
    ],
    theme,
    ctx,
  });
  const share = addTable(summary, {
    startRow: res.nextRow + 2,
    columns: [
      {
        key: "name",
        header: "Socio",
        kind: "formula",
        width: 44,
        formula: (r) =>
          `IF(${sheetRef(ws.name, aportes.cell("name", aportes.firstRow + r.index, true))}="","",${sheetRef(ws.name, aportes.cell("name", aportes.firstRow + r.index, true))})`,
      },
      {
        key: "saved",
        header: "Ahorrado",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",${sheetRef(ws.name, aportes.cell("total", aportes.firstRow + r.index, true))})`,
      },
      {
        key: "pct",
        header: "Participación",
        kind: "formula",
        resultKind: "percent",
        width: 13,
        formula: (r) => `IF(${r.c("name")}="","",IFERROR(${r.c("saved")}/${res.cell("saved")},0))`,
      },
      {
        key: "profit",
        header: "Utilidad que le corresponde",
        kind: "formula",
        resultKind: "currency",
        width: 18,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",ROUND(${r.c("pct")}*${res.cell("profit")},2))`,
      },
    ],
    rows: config.members,
    theme,
    ctx,
    totals: { label: "Totales" },
  });
  void share;
  await protectSheet(ws);
  await protectSheet(loansWs);
  await protectSheet(summary);
  addInstructionsSheet(wb, {
    title: "Caja de ahorro y caja rural",
    description:
      "Lleva las cuentas del grupo: cuánto ha ahorrado cada socio, a quién se le prestó y cuánto le toca a cada quien al repartir.",
    steps: [
      "En Aportes escribe a cada socio y el monto que ahorra cada mes.",
      "En Préstamos registra cada préstamo: socio, monto, interés mensual y plazo; la cuota se calcula sola. Actualiza lo abonado.",
      "El Resumen muestra los fondos disponibles para prestar.",
      "Al cerrar el ciclo escribe las utilidades a repartir: se distribuyen según lo que ahorró cada socio.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
