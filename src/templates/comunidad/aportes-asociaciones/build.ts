import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { offsetCell } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS, addMemberMatrix } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { AsociacionConfig } from "./form";

export const build: TemplateBuild<AsociacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith(`Aportes ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Socios", {
    freezeRows: 6,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const extra = addSheet(wb, "Aportes extra", { freezeRows: 4, tabColor: theme.primary });
  const exp = addSheet(wb, "Gastos", { freezeRows: 4, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "expense", title: "Gastos", values: config.expenseCategories, spare: 10 },
  ]);
  const ex = config.example;
  const fee = config.fee;
  const enr = config.enrollment;

  addSheetHeader(ws, {
    title,
    subtitle: "Escribe lo que paga cada socio en la columna del mes.",
    theme,
    width: 21,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "cut",
        label: "Meses vencidos al corte (1 a 12)",
        kind: "integer",
        value: ex ? 3 : new Date().getMonth() + 1,
      },
    ],
    theme,
    ctx,
  });
  const matrix = addMemberMatrix(ws, {
    startRow: 6,
    rows: config.members,
    months: SHORT_MONTHS,
    monthsDueCell: top.cell("cut"),
    leading: [
      { key: "name", header: "Socio", kind: "text", width: 26 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      { key: "fee", header: "Cuota", kind: "currency", width: 10, fill: fee },
      { key: "enroll", header: "Inscripción", kind: "currency", width: 11, fill: enr },
      {
        key: "enrollPaid",
        header: "Inscripción pagada",
        kind: "currency",
        width: 11,
        total: "sum",
      },
    ],
    feeKey: "fee",
    oneTimeKey: "enroll",
    oneTimePaidKey: "enrollPaid",
    theme,
    ctx,
    example: ex
      ? [
          { name: "Juan Pérez", phone: "9988-7766", enrollPaid: enr, m0: fee, m1: fee, m2: fee },
          { name: "Marta Sánchez", enrollPaid: enr, m0: fee },
          { name: "Óscar Díaz", phone: "3322-1100", m0: fee, m1: fee, m2: fee },
        ]
      : undefined,
  });

  addSheetHeader(extra, {
    title: "Aportes extraordinarios",
    subtitle: "Cuotas especiales, actividades, donaciones y otros ingresos.",
    theme,
    width: 5,
  });
  const memNames = matrix.sheetRange("name");
  const et = addTable(extra, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "member",
        header: "Socio o donante",
        kind: "list",
        width: 26,
        list: { source: memNames },
      },
      { key: "concept", header: "Concepto", kind: "text", width: 30 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "receipt", header: "Recibo", kind: "text", width: 12 },
    ],
    rows: 500,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: exampleDate(y, 2, 20),
            member: "Juan Pérez",
            concept: "Cuota especial feria",
            amount: 300,
            receipt: "R-0045",
          },
        ]
      : undefined,
  });

  addSheetHeader(exp, {
    title: "Gastos de la asociación",
    subtitle: "Cada gasto con su categoría y comprobante.",
    theme,
    width: 5,
  });
  const gt = addTable(exp, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 22,
        list: { source: lists.source("expense") },
      },
      { key: "detail", header: "Detalle", kind: "text", width: 30 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "receipt", header: "Comprobante", kind: "text", width: 14 },
    ],
    rows: 1000,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 25),
            category: config.expenseCategories[0],
            detail: "Refrigerio de asamblea",
            amount: 850,
          },
          {
            date: exampleDate(y, 3, 2),
            category: config.expenseCategories[1] ?? config.expenseCategories[0],
            detail: "Carnés de socios",
            amount: 400,
          },
        ]
      : undefined,
  });

  addSheetHeader(sum, {
    title: `Resumen ${y}`,
    subtitle: "Ingresos por cuotas, aportes extra, gastos y saldo.",
    theme,
    width: 6,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      { key: "opening", label: "Saldo inicial", kind: "currency", value: config.opening },
    ],
    theme,
    ctx,
  });
  const E = (k: string) => et.sheetRange(k);
  const G = (k: string) => gt.sheetRange(k);
  const inRange = (col: string, s?: string, e?: string) => `${col},">="&${s},${col},"<="&${e}`;
  const monthCol = (m: number) => `'Socios'!$${matrix.letter(`m${m - 1}`)}$${matrix.totalRow}`;
  const monthly = addMonthlySummary(sum, {
    startRow: 7,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      { header: "Cuotas", kind: "currency", formula: (k) => monthCol(k.month!) },
      {
        header: "Aportes extra",
        kind: "currency",
        formula: (k) => `SUMIFS(${E("amount")},${inRange(E("date"), k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Gastos",
        kind: "currency",
        formula: (k) => `SUMIFS(${G("amount")},${inRange(G("date"), k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Saldo",
        kind: "currency",
        formula: (k) =>
          `${k.month === 1 ? `${f.cell("opening")}+${matrix.sheetTotal("enrollPaid")}` : offsetCell(k.labelCell, 4, -1)}+${offsetCell(k.labelCell, 1)}+${offsetCell(k.labelCell, 2)}-${offsetCell(k.labelCell, 3)}`,
        total: (range) => `INDEX(${range},12)`,
      },
    ],
  });
  addCategorySummary(sum, {
    startRow: monthly.totalRow + 3,
    startCol: 1,
    labelHeader: "Gastos por categoría",
    sourceCells: cellsOfRange(lists.source("expense")),
    values: [
      {
        header: "Total",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${G("amount")},${G("category")},${k.labelCell}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 24,
  });
  addFields(sum, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "members",
        label: "Socios registrados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${matrix.sheetRange("name")},"<>")`,
      },
      {
        key: "late",
        label: "Socios morosos",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${matrix.sheetRange("status")},"Moroso")`,
      },
      {
        key: "pending",
        label: "Saldo pendiente de socios",
        kind: "calc",
        resultKind: "currency",
        formula: () => matrix.sheetTotal("balance"),
      },
      {
        key: "cash",
        label: "Saldo actual",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () =>
          `${f.cell("opening")}+${matrix.sheetTotal("paid")}+${et.sheetTotal("amount")}-${gt.sheetTotal("amount")}`,
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(4).width = 26;

  for (const w of [ws, extra, exp, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Aportes de asociaciones",
    description: "Lleva las cuotas de los socios y las cuentas de la asociación con transparencia.",
    steps: [
      "En Socios escribe cada socio; la cuota y la inscripción ya vienen llenas y puedes cambiarlas por persona.",
      "Cuando alguien pague escribe el monto en la columna del mes y la inscripción cuando la entregue.",
      "Actualiza los meses vencidos al corte para ver quién está moroso.",
      "Registra aportes extraordinarios y gastos; el Resumen muestra el saldo mes a mes.",
    ],
    tips: ["Imprime el Resumen para presentarlo en la asamblea."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
