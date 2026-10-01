import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { CajaConfig } from "./form";

export const build: TemplateBuild<CajaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({ title: titleWith("Caja diaria", config.businessName), ctx, options });
  const ws = addSheet(wb, "Caja", { tabColor: theme.primary });
  const arqueo = addSheet(wb, "Arqueo", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "categories", title: "Categorías", values: config.categories },
    { key: "payment", title: "Formas de pago", values: config.paymentMethods },
  ]);
  const cashLabel = sheetRef("Listas", "$B$2");

  addSheetHeader(ws, {
    title: titleWith("Caja diaria", config.businessName),
    subtitle: "Registra cada entrada o salida de dinero. El saldo esperado se calcula solo.",
    theme,
    width: 7,
  });

  const header = addFields(ws, {
    startRow: 4,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "date", label: "Fecha", kind: "date" },
      { key: "cashier", label: "Cajero(a)", kind: "text" },
      { key: "fund", label: "Fondo inicial", kind: "currency", value: config.openingFund },
    ],
    theme,
    ctx,
  });

  const table = addTable(ws, {
    startRow: 13,
    columns: [
      { key: "time", header: "Hora", kind: "text", width: 10, align: "center" },
      { key: "concept", header: "Concepto", kind: "text", width: 32 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 11,
        list: ["Entrada", "Salida"],
        align: "center",
      },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 22,
        list: { source: lists.source("categories") },
      },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 16,
        list: { source: lists.source("payment") },
      },
      { key: "amount", header: "Monto", kind: "currency", width: 15 },
      { key: "ref", header: "Referencia", kind: "text", width: 16 },
    ],
    rows: config.rows,
    theme,
    ctx,
    example: config.example
      ? [
          {
            time: "08:15",
            concept: "Ventas de la mañana",
            type: "Entrada",
            category: config.categories[0],
            method: config.paymentMethods[0],
            amount: 2350,
          },
          {
            time: "10:40",
            concept: "Venta con tarjeta",
            type: "Entrada",
            category: config.categories[0],
            method: config.paymentMethods[1] ?? config.paymentMethods[0],
            amount: 780,
          },
          {
            time: "12:05",
            concept: "Compra de pan",
            type: "Salida",
            category: config.categories[2] ?? config.categories[0],
            method: config.paymentMethods[0],
            amount: 420,
          },
          {
            time: "15:30",
            concept: "Abono de doña Rosa",
            type: "Entrada",
            category: config.categories[1] ?? config.categories[0],
            method: config.paymentMethods[0],
            amount: 300,
          },
        ]
      : undefined,
  });

  const amount = table.range("amount");
  const type = table.range("type");
  const method = table.range("method");
  const summary = addFields(ws, {
    startRow: 4,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    title: "Resumen del día",
    fields: [
      {
        key: "inCash",
        label: "Entradas en efectivo",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${amount},${type},"Entrada",${method},${cashLabel})`,
      },
      {
        key: "outCash",
        label: "Salidas en efectivo",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${amount},${type},"Salida",${method},${cashLabel})`,
      },
      {
        key: "expected",
        label: "Efectivo esperado en caja",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${header.cell("fund")}+${ref("inCash")}-${ref("outCash")}`,
      },
      {
        key: "inOther",
        label: "Entradas por otros medios",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `SUMIFS(${amount},${type},"Entrada")-${ref("inCash")}`,
      },
      {
        key: "inTotal",
        label: "Total de entradas",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${amount},${type},"Entrada")`,
      },
      {
        key: "outTotal",
        label: "Total de salidas",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUMIFS(${amount},${type},"Salida")`,
      },
    ],
    theme,
    ctx,
  });
  highlightWhen(
    ws,
    `A${table.firstRow}:G${table.lastRow}`,
    `AND($F${table.firstRow}<>"",$C${table.firstRow}="")`,
    { fill: theme.warningSoft },
  );

  // --- Arqueo -------------------------------------------------------------
  addSheetHeader(arqueo, {
    title: "Arqueo de caja",
    subtitle: "Cuenta los billetes y monedas al cerrar la caja.",
    theme,
    width: 4,
  });
  const denominations = [
    ...ctx.currency.denominations.bills.map((d) => ({ d, kind: "Billete" })),
    ...ctx.currency.denominations.coins.map((d) => ({ d, kind: "Moneda" })),
  ];
  const count = addTable(arqueo, {
    startRow: 4,
    columns: [
      { key: "den", header: "Denominación", kind: "currency", width: 16 },
      { key: "kind", header: "Tipo", kind: "text", width: 12 },
      { key: "qty", header: "Cantidad", kind: "integer", width: 12, align: "center" },
      {
        key: "sub",
        header: "Subtotal",
        kind: "formula",
        resultKind: "currency",
        width: 16,
        total: "sum",
        formula: (r) => `IF(${r.c("qty")}="",0,${r.c("den")}*${r.c("qty")})`,
      },
    ],
    rows: denominations.length,
    theme,
    ctx,
    zebra: true,
    totals: { label: "Total contado" },
    example: denominations.map((x) => ({ den: x.d, kind: x.kind })),
  });
  // Las denominaciones no se editan
  for (let r = count.firstRow; r <= count.lastRow; r++) {
    for (const key of ["den", "kind"]) {
      const cell = arqueo.getCell(r, count.colNumber(key));
      cell.protection = { locked: true };
    }
  }
  if (config.example) {
    const sample: Record<number, number> = { 500: 3, 100: 4, 50: 2, 20: 5, 10: 1, 1: 10 };
    denominations.forEach((x, i) => {
      if (sample[x.d])
        arqueo.getCell(count.firstRow + i, count.colNumber("qty")).value = sample[x.d]!;
    });
  }
  const result = addFields(arqueo, {
    startRow: (count.totalRow ?? count.lastRow) + 2,
    labelCol: 1,
    valueCol: 4,
    labelSpan: 3,
    fields: [
      {
        key: "counted",
        label: "Total contado",
        kind: "calc",
        resultKind: "currency",
        formula: () => count.total("sub"),
      },
      {
        key: "expected",
        label: "Efectivo esperado (hoja Caja)",
        kind: "calc",
        resultKind: "currency",
        formula: () => summary.ref("expected"),
      },
      {
        key: "diff",
        label: "Diferencia",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) => `${ref("counted")}-${ref("expected")}`,
      },
      {
        key: "status",
        label: "Resultado",
        kind: "calc",
        emphasis: true,
        formula: (ref) =>
          `IF(ROUND(${ref("diff")},2)=0,"Caja cuadrada",IF(${ref("diff")}>0,"Sobrante","Faltante"))`,
      },
    ],
    theme,
    ctx,
  });
  const statusCell = result.cell("status").replace(/\$/g, "");
  highlightWhen(arqueo, statusCell, `${result.cell("status")}="Faltante"`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  highlightWhen(arqueo, statusCell, `${result.cell("status")}="Sobrante"`, {
    fill: theme.warningSoft,
    bold: true,
  });
  highlightWhen(arqueo, statusCell, `${result.cell("status")}="Caja cuadrada"`, {
    fill: theme.okSoft,
    bold: true,
  });

  const signRow = result.nextRow + 3;
  for (const [col, label] of [
    [1, "Firma del cajero(a)"],
    [3, "Firma del supervisor(a)"],
  ] as const) {
    const c = arqueo.getCell(signRow, col);
    c.value = label;
    c.border = { top: { style: "thin" } };
    c.alignment = { horizontal: "center" };
  }

  await protectSheet(ws);
  await protectSheet(arqueo);

  addInstructionsSheet(wb, {
    title: "Caja diaria y arqueo",
    description:
      "Controla el dinero que entra y sale de tu caja y verifica al cierre si cuadra con lo contado.",
    steps: [
      "En la hoja Caja escribe la fecha, el nombre de quien atiende y el fondo inicial.",
      "Registra cada movimiento: concepto, si es entrada o salida, la categoría, la forma de pago y el monto.",
      "El resumen calcula el efectivo que debería haber en caja (la primera forma de pago de la hoja Listas se considera efectivo).",
      "Al cerrar, en la hoja Arqueo escribe cuántos billetes y monedas hay de cada denominación.",
      "La diferencia indica si la caja está cuadrada, con sobrante o con faltante.",
    ],
    sheets: [
      { name: "Caja", description: "Movimientos del día y resumen." },
      { name: "Arqueo", description: "Conteo de billetes y monedas y resultado del cuadre." },
      { name: "Listas", description: "Categorías y formas de pago." },
    ],
    tips: ["Usa una copia del archivo (o duplica las hojas) para cada día o turno."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
