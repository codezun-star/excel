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
import type { TemplateBuild } from "@/templates/types";

import type { IglesiaConfig } from "./form";

export const build: TemplateBuild<IglesiaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith(`Tesorería ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const reg = addSheet(wb, "Registro", { freezeRows: 4, tabColor: theme.primary, landscape: true });
  const sum = addSheet(wb, "Informe", { tabColor: theme.primary });
  const mem = addSheet(wb, "Miembros", { freezeRows: 4, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "income", title: "Ingresos", values: config.incomeCategories },
    { key: "expense", title: "Egresos", values: config.expenseCategories },
    {
      key: "all",
      title: "Todas",
      values: [...config.incomeCategories, ...config.expenseCategories],
      spare: 10,
    },
  ]);
  const ex = config.example;
  const inc = (i: number) => config.incomeCategories[i] ?? config.incomeCategories[0]!;
  const exp = (i: number) => config.expenseCategories[i] ?? config.expenseCategories[0]!;
  const memStart = 4;
  const memNames = `'Miembros'!$A$${memStart + 1}:$A$${memStart + config.members}`;

  addSheetHeader(reg, {
    title,
    subtitle: "Cada ingreso o egreso con su categoría y comprobante.",
    theme,
    width: 7,
  });
  const table = addTable(reg, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 10,
        list: ["Ingreso", "Egreso"],
        align: "center",
      },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 20,
        list: { source: lists.source("all") },
      },
      { key: "detail", header: "Descripción", kind: "text", width: 30 },
      {
        key: "member",
        header: "Miembro o donante",
        kind: "list",
        width: 22,
        list: { source: memNames },
      },
      { key: "amount", header: "Monto", kind: "currency", width: 13 },
      { key: "receipt", header: "N.º de recibo o factura", kind: "text", width: 16 },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 5),
            type: "Ingreso",
            category: inc(0),
            detail: "Diezmo",
            member: "Hno. José Martínez",
            amount: 1500,
          },
          {
            date: exampleDate(y, 1, 5),
            type: "Ingreso",
            category: inc(1),
            detail: "Ofrenda del culto dominical",
            amount: 2350,
          },
          {
            date: exampleDate(y, 1, 10),
            type: "Egreso",
            category: exp(1),
            detail: "Recibo de energía",
            amount: 1800,
            receipt: "ENEE-0125",
          },
          {
            date: exampleDate(y, 2, 2),
            type: "Ingreso",
            category: inc(0),
            detail: "Diezmo",
            member: "Hna. Carmen López",
            amount: 900,
          },
          {
            date: exampleDate(y, 2, 15),
            type: "Egreso",
            category: exp(2),
            detail: "Víveres para familias",
            amount: 1200,
          },
        ]
      : undefined,
  });
  const R = (k: string) => table.sheetRange(k);

  addSheetHeader(mem, {
    title: "Miembros y donantes",
    subtitle: "Total aportado en el año por cada persona.",
    theme,
    width: 4,
  });
  addTable(mem, {
    startRow: memStart,
    columns: [
      { key: "name", header: "Nombre", kind: "text", width: 26 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      {
        key: "total",
        header: "Total aportado",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${R("amount")},${R("member")},${r.c("name")},${R("type")},"Ingreso"))`,
      },
      {
        key: "count",
        header: "Aportes",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        formula: (r) =>
          `IF(${r.c("name")}="","",COUNTIFS(${R("member")},${r.c("name")},${R("type")},"Ingreso"))`,
      },
    ],
    rows: config.members,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex ? [{ name: "Hno. José Martínez" }, { name: "Hna. Carmen López" }] : undefined,
  });

  addSheetHeader(sum, {
    title: `Informe financiero ${y}`,
    subtitle: "Ingresos, egresos y saldo por mes y por categoría.",
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
  const Y = f.cell("year");
  const inMonth = (s?: string, e?: string) => `${R("date")},">="&${s},${R("date")},"<="&${e}`;
  const inYear = `${R("date")},">="&DATE(${Y},1,1),${R("date")},"<="&DATE(${Y},12,31)`;
  const monthly = addMonthlySummary(sum, {
    startRow: 7,
    startCol: 1,
    yearCell: Y,
    theme,
    ctx,
    values: [
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"Ingreso",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Egresos",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${R("amount")},${R("type")},"Egreso",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Resultado",
        kind: "currency",
        formula: (k) => `${offsetCell(k.labelCell, 1)}-${offsetCell(k.labelCell, 2)}`,
      },
      {
        header: "Saldo en caja",
        kind: "currency",
        formula: (k) =>
          k.month === 1
            ? `${f.cell("opening")}+${offsetCell(k.labelCell, 3)}`
            : `${offsetCell(k.labelCell, 4, -1)}+${offsetCell(k.labelCell, 3)}`,
        total: (range) => `INDEX(${range},12)`,
      },
    ],
  });
  const incSum = addCategorySummary(sum, {
    startRow: monthly.totalRow + 3,
    startCol: 1,
    labelHeader: "Ingresos por categoría",
    sourceCells: cellsOfRange(lists.source("income")),
    values: [
      {
        header: "Total del año",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("amount")},${R("category")},${k.labelCell},${R("type")},"Ingreso",${inYear}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 26,
  });
  addCategorySummary(sum, {
    startRow: incSum.totalRow + 3,
    startCol: 1,
    labelHeader: "Egresos por categoría",
    sourceCells: cellsOfRange(lists.source("expense")),
    values: [
      {
        header: "Total del año",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("amount")},${R("category")},${k.labelCell},${R("type")},"Egreso",${inYear}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 26,
  });
  addFields(sum, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "income",
        label: "Ingresos del año",
        kind: "calc",
        resultKind: "currency",
        formula: () => monthly.totalCell(0),
      },
      {
        key: "expense",
        label: "Egresos del año",
        kind: "calc",
        resultKind: "currency",
        formula: () => monthly.totalCell(1),
      },
      {
        key: "balance",
        label: "Saldo actual",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `${f.cell("opening")}+${monthly.totalCell(0)}-${monthly.totalCell(1)}`,
      },
    ],
    theme,
    ctx,
  });

  for (const w of [reg, sum, mem]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Contabilidad de iglesias",
    description: "Lleva la tesorería con orden y presenta informes claros a la congregación.",
    steps: [
      "En Informe escribe el saldo inicial en caja y banco.",
      "En Registro anota cada ingreso o egreso con su fecha, categoría, descripción y número de recibo.",
      "Para diezmos y ofrendas personales elige el miembro (agrégalo antes en Miembros).",
      "El Informe muestra ingresos, egresos y saldo por mes y los totales por categoría; en Miembros ves lo aportado por cada persona.",
    ],
    tips: [
      "Cuenta las ofrendas con dos personas y registra el total el mismo día.",
      "Guarda los comprobantes de cada gasto con su número de recibo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
