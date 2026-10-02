import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { offsetCell } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import {
  MONTHS_ES,
  addCategorySummary,
  addMonthlySummary,
  cellsOfRange,
} from "@/lib/excel/summary";
import { addTable, type ColumnDef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS, addMemberMatrix } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { CondominioConfig } from "./form";

const EXAMPLE_BUDGET = [6000, 2000, 1200, 800, 600, 900, 1000, 500, 300];
/** Unidades de ejemplo: área y meses pagados (la cuota se calcula igual que en la hoja). */
const EXAMPLE_UNITS = [
  { unit: "Casa A-1", owner: "Familia Zelaya", area: 180, months: 3 },
  { unit: "Casa A-2", owner: "Familia Rivera", area: 150, months: 1 },
  { unit: "Casa B-1", owner: "Familia Ordóñez", area: 120, months: 3 },
  { unit: "Local 1", owner: "Farmacia La Salud", area: 90, months: 2 },
];

export const build: TemplateBuild<CondominioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith(`Condominio ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const bud = addSheet(wb, "Presupuesto", { freezeRows: 4, tabColor: theme.primary });
  const fees = addSheet(wb, "Cuotas", {
    freezeRows: 7,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const exp = addSheet(wb, "Gastos", { freezeRows: 4, tabColor: theme.primary });
  const st = addSheet(wb, "Estado de cuenta", { tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;
  const cats = config.expenseCategories;

  // Presupuesto mensual de gastos comunes
  addSheetHeader(bud, {
    title: `Presupuesto de gastos comunes ${y}`,
    subtitle: "Monto mensual por categoría; la cuota se calcula con este total.",
    theme,
    width: 4,
  });
  const bt = addTable(bud, {
    startRow: 4,
    columns: [
      { key: "category", header: "Categoría", kind: "text", width: 28 },
      { key: "monthly", header: "Presupuesto mensual", kind: "currency", width: 16, total: "sum" },
      {
        key: "annual",
        header: "Presupuesto anual",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) => `IF(${r.c("category")}="","",${r.c("monthly")}*12)`,
      },
    ],
    rows: cats.length + 5,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  cats.forEach((c, i) => {
    bud.getCell(bt.firstRow + i, bt.colNumber("category")).value = c;
    if (ex) bud.getCell(bt.firstRow + i, bt.colNumber("monthly")).value = EXAMPLE_BUDGET[i] ?? 1000;
  });
  const bf = addFields(bud, {
    startRow: (bt.totalRow ?? bt.lastRow) + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "reserve", label: "Fondo de reserva", kind: "percent", value: config.reserve / 100 },
      {
        key: "reserveAmt",
        label: "Aporte mensual al fondo de reserva",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `ROUND(${bt.total("monthly")}*${c("reserve")},2)`,
      },
      {
        key: "toCollect",
        label: "Total mensual a cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `${bt.total("monthly")}+${c("reserveAmt")}`,
      },
    ],
    theme,
    ctx,
  });
  const TO_COLLECT = `'Presupuesto'!${bf.cell("toCollect")}`;

  // Cuotas por unidad
  addSheetHeader(fees, {
    title: titleWith(`Cuotas de mantenimiento ${y}`, config.businessName),
    subtitle: "Escribe lo que paga cada unidad en la columna del mes.",
    theme,
    width: 21,
  });
  const top = addFields(fees, {
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
      { key: "late", label: "Recargo por mora", kind: "percent", value: config.lateFee / 100 },
    ],
    theme,
    ctx,
  });
  const feeCol: ColumnDef =
    config.feeMode === "share"
      ? {
          key: "fee",
          header: "Cuota mensual",
          kind: "formula",
          resultKind: "currency",
          width: 12,
          total: "sum",
          formula: (r) => `IF(${r.c("unit")}="","",ROUND(${TO_COLLECT}*${r.c("share")},2))`,
        }
      : {
          key: "fee",
          header: "Cuota mensual",
          kind: "currency",
          width: 12,
          fill: config.fixedFee,
          total: "sum",
        };
  const fixedFee = config.fixedFee;
  const budget = cats.reduce((acc, _, i) => acc + (EXAMPLE_BUDGET[i] ?? 1000), 0);
  const toCollect = budget + Math.round(budget * (config.reserve / 100) * 100) / 100;
  const totalArea = EXAMPLE_UNITS.reduce((acc, u) => acc + u.area, 0);
  const exampleFee = (area: number) => Math.round(((toCollect * area) / totalArea) * 100) / 100;
  const matrix = addMemberMatrix(fees, {
    startRow: 7,
    rows: config.units,
    months: SHORT_MONTHS,
    monthsDueCell: top.cell("cut"),
    leading: [
      { key: "unit", header: "Unidad", kind: "text", width: 12 },
      { key: "owner", header: "Propietario o inquilino", kind: "text", width: 24 },
      { key: "area", header: "Área (m²)", kind: "number", width: 10, total: "sum" },
      {
        key: "share",
        header: "Alícuota",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("unit")}="","",IF(SUM(${r.col("area")})=0,0,${r.c("area")}/SUM(${r.col("area")})))`,
      },
      feeCol,
    ],
    feeKey: "fee",
    theme,
    ctx,
    example: ex
      ? EXAMPLE_UNITS.map(({ months, ...row }) => {
          const fee = config.feeMode === "fixed" ? fixedFee : exampleFee(row.area);
          const paid: Record<string, number> = {};
          for (let m = 0; m < months; m++) paid[`m${m}`] = fee;
          return { ...row, ...paid };
        })
      : undefined,
  });
  const M = (k: string) => matrix.sheetRange(k);

  // Gastos reales
  addSheetHeader(exp, {
    title: "Gastos comunes",
    subtitle: "Cada pago con su categoría del presupuesto y factura.",
    theme,
    width: 6,
  });
  const gt = addTable(exp, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 24,
        list: { source: bt.sheetRange("category") },
      },
      { key: "supplier", header: "Proveedor", kind: "text", width: 22 },
      { key: "detail", header: "Detalle", kind: "text", width: 28 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "invoice", header: "Factura", kind: "text", width: 14 },
    ],
    rows: 2000,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 5),
            category: cats[0],
            supplier: "Seguridad Total S. de R.L.",
            detail: "Vigilancia de enero",
            amount: 6000,
            invoice: "000-001-01-00001234",
          },
          {
            date: exampleDate(y, 1, 12),
            category: cats[2] ?? cats[0],
            supplier: "ENEE",
            detail: "Alumbrado de calles",
            amount: 1150,
          },
          {
            date: exampleDate(y, 2, 5),
            category: cats[0],
            supplier: "Seguridad Total S. de R.L.",
            detail: "Vigilancia de febrero",
            amount: 6000,
          },
        ]
      : undefined,
  });
  const G = (k: string) => gt.sheetRange(k);

  // Estado de cuenta por unidad
  addSheetHeader(st, {
    title: "Estado de cuenta",
    subtitle: "Elige la unidad para ver sus pagos, saldo y recargo.",
    theme,
    width: 5,
  });
  const sf = addFields(st, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "unit",
        label: "Unidad",
        kind: "list",
        list: { source: M("unit") },
        value: ex ? "Casa A-2" : undefined,
      },
      {
        key: "idx",
        label: "Fila en la hoja Cuotas",
        kind: "calc",
        resultKind: "integer",
        formula: (c) => `IF(${c("unit")}="","",IFERROR(MATCH(${c("unit")},${M("unit")},0),""))`,
      },
      {
        key: "owner",
        label: "Propietario o inquilino",
        kind: "calc",
        resultKind: "text",
        formula: (c) => `IF(${c("idx")}="","",INDEX(${M("owner")},${c("idx")}))`,
      },
      {
        key: "fee",
        label: "Cuota mensual",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `IF(${c("idx")}="","",INDEX(${M("fee")},${c("idx")}))`,
      },
    ],
    theme,
    ctx,
  });
  const IDX = sf.cell("idx");
  const stt = addTable(st, {
    startRow: sf.nextRow + 1,
    columns: [
      { key: "month", header: "Mes", kind: "text", width: 14 },
      {
        key: "due",
        header: "Cuota",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${IDX}="","",IF(${r.index + 1}<=${top.ref("cut")},${sf.cell("fee")},0))`,
      },
      {
        key: "paid",
        header: "Pagado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${IDX}="","",INDEX(${M(`m${r.index}`)},${IDX}))`,
      },
      {
        key: "running",
        header: "Saldo acumulado",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        allowNegative: true,
        formula: (r) =>
          `IF(${IDX}="","",${r.prev("running") ? `N(${r.prev("running")})+` : ""}${r.c("due")}-${r.c("paid")})`,
      },
    ],
    rows: 12,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  MONTHS_ES.forEach((m, i) => (st.getCell(stt.firstRow + i, stt.colNumber("month")).value = m));
  addFields(st, {
    startRow: (stt.totalRow ?? stt.lastRow) + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "balance",
        label: "Saldo vencido",
        kind: "calc",
        resultKind: "currency",
        formula: () => `IF(${IDX}="","",MAX(0,${stt.total("due")}-${stt.total("paid")}))`,
      },
      {
        key: "late",
        label: "Recargo por mora",
        kind: "calc",
        resultKind: "currency",
        formula: (c) => `IF(${IDX}="","",ROUND(${c("balance")}*${top.ref("late")},2))`,
      },
      {
        key: "total",
        label: "Total a pagar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `IF(${IDX}="","",${c("balance")}+${c("late")})`,
      },
    ],
    theme,
    ctx,
  });
  st.getColumn(1).width = 26;

  // Resumen
  addSheetHeader(sum, {
    title: `Resumen ${y}`,
    subtitle: "Cobros, gastos, saldo y ejecución del presupuesto.",
    theme,
    width: 7,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      { key: "opening", label: "Saldo inicial en caja", kind: "currency", value: config.opening },
    ],
    theme,
    ctx,
  });
  const inRange = (s?: string, e?: string) => `${G("date")},">="&${s},${G("date")},"<="&${e}`;
  const monthly = addMonthlySummary(sum, {
    startRow: 11,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Cuotas cobradas",
        kind: "currency",
        formula: (k) => `'Cuotas'!$${matrix.letter(`m${k.month! - 1}`)}$${matrix.totalRow}`,
      },
      { header: "Presupuesto", kind: "currency", formula: () => bt.sheetTotal("monthly") },
      {
        header: "Gasto real",
        kind: "currency",
        formula: (k) => `SUMIFS(${G("amount")},${inRange(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Diferencia",
        kind: "currency",
        formula: (k) => `${offsetCell(k.labelCell, 2)}-${offsetCell(k.labelCell, 3)}`,
      },
      {
        header: "Saldo en caja",
        kind: "currency",
        formula: (k) =>
          `${k.month === 1 ? f.cell("opening") : offsetCell(k.labelCell, 5, -1)}+${offsetCell(k.labelCell, 1)}-${offsetCell(k.labelCell, 3)}`,
        total: (range) => `INDEX(${range},12)`,
      },
    ],
  });
  const yearOf = `${G("date")},">="&DATE(${f.cell("year")},1,1),${G("date")},"<="&DATE(${f.cell("year")},12,31)`;
  const exec = addCategorySummary(sum, {
    startRow: monthly.totalRow + 3,
    startCol: 1,
    labelHeader: "Ejecución por categoría",
    sourceCells: cellsOfRange(bt.sheetRange("category")),
    values: [
      {
        header: "Presupuesto anual",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${bt.sheetRange("annual")},${bt.sheetRange("category")},${k.labelCell}))`,
      },
      {
        header: "Gasto real",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${G("amount")},${G("category")},${k.labelCell},${yearOf}))`,
      },
      {
        header: "Disponible",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",${offsetCell(k.labelCell, 1)}-${offsetCell(k.labelCell, 2)})`,
      },
      {
        header: "% ejecutado",
        kind: "percent",
        formula: (k) =>
          `IF(${k.labelCell}="","",IF(N(${offsetCell(k.labelCell, 1)})=0,0,${offsetCell(k.labelCell, 2)}/${offsetCell(k.labelCell, 1)}))`,
        total: false,
      },
    ],
    theme,
    ctx,
    labelWidth: 26,
  });
  const pctCol = exec.column(3);
  const pctFirst = pctCol.split(":")[0]!.replace(/\$/g, "");
  highlightWhen(
    sum,
    pctCol.replace(/\$/g, ""),
    `AND(ISNUMBER(${pctFirst}),${pctFirst}>1)`,
    { fill: theme.dangerSoft, bold: true },
    1,
  );
  addFields(sum, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "units",
        label: "Unidades registradas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${M("unit")},"<>")`,
      },
      {
        key: "late",
        label: "Unidades morosas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${M("status")},"Moroso")`,
      },
      {
        key: "rate",
        label: "Morosidad",
        kind: "calc",
        resultKind: "percent",
        formula: (c) => `IF(${c("units")}=0,0,${c("late")}/${c("units")})`,
      },
      {
        key: "pending",
        label: "Saldo por cobrar",
        kind: "calc",
        resultKind: "currency",
        formula: () => matrix.sheetTotal("balance"),
      },
      {
        key: "reserve",
        label: "Fondo de reserva acumulado",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `IF(${TO_COLLECT}=0,0,ROUND(${matrix.sheetTotal("paid")}*'Presupuesto'!${bf.cell("reserveAmt")}/${TO_COLLECT},2))`,
      },
      {
        key: "cash",
        label: "Saldo en caja",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => monthly.totalCell(4),
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(4).width = 26;

  for (const w of [bud, fees, exp, st, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Administración de condominios",
    description: "Presupuesto, cuotas, cobros y gastos del residencial en un solo archivo.",
    steps: [
      "En Presupuesto escribe el monto mensual de cada gasto común y revisa el porcentaje del fondo de reserva.",
      config.feeMode === "share"
        ? "En Cuotas escribe cada unidad con su área: la alícuota y la cuota se calculan solas."
        : "En Cuotas escribe cada unidad; la cuota fija ya viene llena y puedes cambiarla por unidad.",
      "Cada vez que una unidad pague escribe el monto en la columna del mes y actualiza los meses vencidos al corte.",
      "Registra cada gasto en Gastos; el Resumen compara lo presupuestado con lo gastado y muestra el saldo en caja.",
      "En Estado de cuenta elige una unidad para imprimirle su saldo con el recargo por mora.",
    ],
    tips: [
      "Las categorías con más de 100 % ejecutado se marcan en rojo.",
      "Presenta el Resumen en la asamblea de propietarios.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 1);
  return wb;
};
