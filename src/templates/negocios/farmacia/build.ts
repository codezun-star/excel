import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import { fromToday, monthDayFormula } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { FarmaciaConfig } from "./form";

export const build: TemplateBuild<FarmaciaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Farmacia", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const lotWs = addSheet(wb, "Lotes", { freezeRows: 10, tabColor: theme.primary, landscape: true });
  const saleWs = addSheet(wb, "Ventas", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const catWs = addSheet(wb, "Medicamentos", { freezeRows: 4, tabColor: theme.primary });
  const resWs = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;
  const lotStart = 10;
  const lotIds = `'Lotes'!$C$${lotStart + 1}:$C$${lotStart + config.lots}`;
  const lotCodes = `'Lotes'!$A$${lotStart + 1}:$A$${lotStart + config.lots}`;

  addSheetHeader(catWs, {
    title: "Medicamentos",
    subtitle: "Catálogo con precio de venta.",
    theme,
    width: 6,
  });
  const cat = addTable(catWs, {
    startRow: 4,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 11 },
      { key: "name", header: "Medicamento", kind: "text", width: 30 },
      { key: "form", header: "Presentación", kind: "text", width: 18 },
      { key: "price", header: "Precio de venta", kind: "currency", width: 13 },
      {
        key: "rx",
        header: "Requiere receta",
        kind: "list",
        width: 12,
        list: ["Sí", "No"],
        align: "center",
      },
      { key: "min", header: "Existencia mínima", kind: "number", width: 12 },
    ],
    rows: config.products,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            code: "ACE500",
            name: "Acetaminofén 500 mg",
            form: "Caja 100 tabletas",
            price: 95,
            rx: "No",
            min: 10,
          },
          {
            code: "AMX500",
            name: "Amoxicilina 500 mg",
            form: "Caja 21 cápsulas",
            price: 180,
            rx: "Sí",
            min: 5,
          },
          { code: "SUE01", name: "Suero oral", form: "Sobre", price: 25, rx: "No", min: 30 },
        ]
      : undefined,
  });
  const codes = cat.sheetRange("code");
  const names = cat.sheetRange("name");
  const prices = cat.sheetRange("price");

  addSheetHeader(saleWs, {
    title: "Ventas",
    subtitle: "Elige el lote vendido: el medicamento y el precio aparecen solos.",
    theme,
    width: 8,
  });
  const sales = addTable(saleWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "lot", header: "Lote", kind: "list", width: 14, list: { source: lotIds } },
      {
        key: "code",
        header: "Código",
        kind: "formula",
        width: 10,
        formula: (r) =>
          `IF(${r.c("lot")}="","",IFERROR(INDEX(${lotCodes},MATCH(${r.c("lot")},${lotIds},0)),""))`,
      },
      {
        key: "name",
        header: "Medicamento",
        kind: "formula",
        width: 26,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${names},MATCH(${r.c("code")},${codes},0)),"Código no existe"))`,
      },
      { key: "qty", header: "Cantidad", kind: "number", width: 9 },
      {
        key: "price",
        header: "Precio",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${prices},MATCH(${r.c("code")},${codes},0)),0))`,
      },
      {
        key: "total",
        header: "Total",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("lot")}="","",ROUND(N(${r.c("qty")})*N(${r.c("price")}),2))`,
      },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 14,
        list: ["Efectivo", "Tarjeta", "Transferencia"],
      },
    ],
    rows: config.sales,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          { date: fromToday(-1), lot: "A-1001", qty: 2, method: "Efectivo" },
          { date: fromToday(-1), lot: "S-0501", qty: 10, method: "Efectivo" },
          { date: fromToday(0), lot: "X-2002", qty: 1, method: "Tarjeta" },
        ]
      : undefined,
  });
  const S = (k: string) => sales.sheetRange(k);

  addSheetHeader(lotWs, {
    title,
    subtitle: "Cada lote recibido con su fecha de vencimiento.",
    theme,
    width: 11,
  });
  const settings = addFields(lotWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "alert",
        label: "Avisar cuando falten (días)",
        kind: "integer",
        value: config.alertDays,
      },
    ],
    theme,
    ctx,
  });
  const lots = addTable(lotWs, {
    startRow: lotStart,
    columns: [
      { key: "code", header: "Código", kind: "list", width: 11, list: { source: codes } },
      {
        key: "name",
        header: "Medicamento",
        kind: "formula",
        width: 26,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${names},MATCH(${r.c("code")},${codes},0)),"Código no existe"))`,
      },
      { key: "lot", header: "Lote", kind: "text", width: 12 },
      { key: "expires", header: "Vence", kind: "date", width: 12 },
      { key: "qtyIn", header: "Cantidad recibida", kind: "number", width: 11 },
      { key: "cost", header: "Costo unitario", kind: "currency", width: 12 },
      {
        key: "sold",
        header: "Vendido",
        kind: "formula",
        resultKind: "number",
        width: 9,
        formula: (r) => `IF(${r.c("lot")}="","",SUMIFS(${S("qty")},${S("lot")},${r.c("lot")}))`,
      },
      {
        key: "stock",
        header: "Existencia",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) => `IF(${r.c("lot")}="","",N(${r.c("qtyIn")})-${r.c("sold")})`,
      },
      {
        key: "days",
        header: "Días para vencer",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("lot")}="",${r.c("expires")}=""),"",${r.c("expires")}-TODAY())`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("days")}="","",IF(${r.c("stock")}<=0,"Agotado",IF(${r.c("days")}<0,"Vencido",IF(${r.c("days")}<=${settings.cell("alert")},"Por vencer","OK"))))`,
      },
      {
        key: "value",
        header: "Valor al costo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("lot")}="","",ROUND(MAX(0,${r.c("stock")})*N(${r.c("cost")}),2))`,
      },
    ],
    rows: config.lots,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Valor del inventario" },
    example: ex
      ? [
          { code: "ACE500", lot: "A-1001", expires: fromToday(400), qtyIn: 20, cost: 60 },
          { code: "AMX500", lot: "X-2002", expires: fromToday(45), qtyIn: 10, cost: 120 },
          { code: "SUE01", lot: "S-0501", expires: fromToday(-5), qtyIn: 50, cost: 12 },
        ]
      : undefined,
  });
  const st = lots.range("status");
  addFields(lotWs, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "expired",
        label: "Lotes vencidos con existencia",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${st},"Vencido")`,
      },
      {
        key: "soon",
        label: "Lotes por vencer",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${st},"Por vencer")`,
      },
      {
        key: "risk",
        label: "Valor vencido o por vencer",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () =>
          `SUMIFS(${lots.range("value")},${st},"Vencido")+SUMIFS(${lots.range("value")},${st},"Por vencer")`,
      },
    ],
    theme,
    ctx,
  });
  const s = lots.letter("status");
  const range = `A${lots.firstRow}:${lots.letter("value")}${lots.lastRow}`;
  highlightWhen(
    lotWs,
    range,
    `$${s}${lots.firstRow}="Vencido"`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(lotWs, range, `$${s}${lots.firstRow}="Por vencer"`, { fill: theme.warningSoft }, 2);

  // Resumen de ventas del mes
  addSheetHeader(resWs, {
    title: `Ventas — ${periodLabel(config.month, config.year)}`,
    subtitle: "Ventas por día del mes.",
    theme,
    width: 4,
  });
  const p = addFields(resWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: config.year },
      { key: "month", label: "Mes (1 a 12)", kind: "integer", value: config.month },
    ],
    theme,
    ctx,
  });
  addTable(resWs, {
    startRow: 7,
    columns: [
      {
        key: "date",
        header: "Día",
        kind: "formula",
        resultKind: "date",
        width: 16,
        formula: (r) => monthDayFormula(r.prev("date"), p.cell("year"), p.cell("month")),
      },
      {
        key: "count",
        header: "Ventas",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",COUNTIFS(${S("date")},${r.c("date")},${S("lot")},"<>"))`,
      },
      {
        key: "total",
        header: "Total vendido",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${S("total")},${S("date")},${r.c("date")}))`,
      },
    ],
    rows: 31,
    theme,
    ctx,
    totals: { label: "Total del mes" },
  });

  for (const w of [lotWs, saleWs, catWs, resWs]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Control de farmacia",
    description: "Medicamentos por lote, vencimientos y ventas en un solo archivo.",
    steps: [
      "En Medicamentos registra el catálogo: código, nombre, presentación, precio y si requiere receta.",
      "En Lotes registra cada lote recibido eligiendo el código: lote, vencimiento, cantidad y costo.",
      "En Ventas elige el lote vendido y la cantidad: el medicamento, el precio y el total aparecen solos.",
      "Las existencias y las alertas de vencimiento se actualizan solas; en Resumen ves las ventas por día.",
    ],
    tips: [
      "Vende primero el lote que vence primero: filtra Lotes por «Vence».",
      "Retira de la venta los lotes vencidos y regístralos como merma para no descuadrar existencias.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
