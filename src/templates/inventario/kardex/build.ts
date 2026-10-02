import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { KardexConfig } from "./form";

export const build: TemplateBuild<KardexConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Kardex", config.product || config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Kardex", { freezeRows: 9, landscape: true, tabColor: theme.primary });
  addSheetHeader(ws, {
    title: titleWith("Tarjeta kardex", config.businessName),
    subtitle: "Método de valuación: costo promedio ponderado.",
    theme,
    width: 13,
  });
  const ex = config.example;
  const head = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "product",
        label: "Producto",
        kind: "text",
        value: config.product || (ex ? "Aceite vegetal 1 L" : null),
      },
      { key: "code", label: "Código", kind: "text", value: config.code || (ex ? "AC-01" : null) },
      { key: "unit", label: "Unidad", kind: "text", value: config.unit },
    ],
    theme,
    ctx,
  });
  const init = addFields(ws, {
    startRow: 3,
    labelCol: 6,
    valueCol: 8,
    labelSpan: 2,
    fields: [
      { key: "qty", label: "Saldo inicial (unidades)", kind: "number", value: ex ? 50 : 0 },
      { key: "cost", label: "Costo unitario inicial", kind: "currency", value: ex ? 40 : 0 },
      {
        key: "total",
        label: "Valor inicial",
        kind: "calc",
        resultKind: "currency",
        formula: (r) => `${r("qty")}*${r("cost")}`,
      },
    ],
    theme,
    ctx,
  });
  void head;
  const I = init.cell;
  const table = addTable(ws, {
    startRow: 9,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 11 },
      { key: "detail", header: "Detalle", kind: "text", width: 26 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 9,
        list: ["Entrada", "Salida"],
        align: "center",
      },
      { key: "qty", header: "Cantidad", kind: "number", width: 9 },
      {
        key: "unitCost",
        header: "Costo unitario de compra",
        kind: "currency",
        width: 13,
        note: "Solo para entradas. Las salidas se valúan al costo promedio.",
      },
      {
        key: "inTotal",
        header: "Entradas (valor)",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("type")}="Entrada",ROUND(${r.c("qty")}*${r.c("unitCost")},2),"")`,
      },
      {
        key: "outUnit",
        header: "Costo unitario salida",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) => `IF(${r.c("type")}="Salida",${r.prev("avg") ?? I("cost")},"")`,
      },
      {
        key: "outTotal",
        header: "Salidas (valor)",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("type")}="Salida",ROUND(${r.c("qty")}*${r.c("outUnit")},2),"")`,
      },
      {
        key: "balQty",
        header: "Saldo (unidades)",
        kind: "formula",
        resultKind: "number",
        width: 11,
        formula: (r) =>
          `${r.prev("balQty") ?? I("qty")}+IF(${r.c("type")}="Entrada",N(${r.c("qty")}),0)-IF(${r.c("type")}="Salida",N(${r.c("qty")}),0)`,
      },
      {
        key: "balTotal",
        header: "Saldo (valor)",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `${r.prev("balTotal") ?? I("total")}+N(${r.c("inTotal")})-N(${r.c("outTotal")})`,
      },
      {
        key: "avg",
        header: "Costo promedio",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IFERROR(${r.c("balTotal")}/${r.c("balQty")},${r.prev("avg") ?? I("cost")})`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            date: "2026-03-02",
            detail: "Compra factura 4512",
            type: "Entrada",
            qty: 100,
            unitCost: 43,
          },
          { date: "2026-03-05", detail: "Ventas de la semana", type: "Salida", qty: 80 },
          {
            date: "2026-03-12",
            detail: "Compra factura 4630",
            type: "Entrada",
            qty: 60,
            unitCost: 45,
          },
        ]
      : undefined,
  });
  // En filas sin movimiento los saldos se arrastran: se atenúan para que no distraigan
  const t = `$${table.letter("type")}${table.firstRow}`;
  highlightWhen(
    ws,
    `${table.letter("balQty")}${table.firstRow}:${table.letter("avg")}${table.lastRow}`,
    `${t}=""`,
    { color: theme.calc },
  );
  highlightWhen(
    ws,
    `${table.letter("balQty")}${table.firstRow}:${table.letter("balQty")}${table.lastRow}`,
    `AND(${t}<>"",${table.letter("balQty")}${table.firstRow}<0)`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Kardex",
    description:
      "Controla un producto con su costo promedio ponderado, como lo exige una contabilidad de inventarios ordenada.",
    steps: [
      "Escribe el producto, su código y el saldo inicial en unidades y costo unitario.",
      "Registra cada movimiento: fecha, detalle, tipo (Entrada o Salida) y cantidad. En las entradas escribe el costo unitario de compra.",
      "Las salidas se valúan solas al costo promedio vigente; los saldos y el nuevo costo promedio se recalculan en cada fila.",
      "Para otro producto, duplica la hoja (clic derecho en la pestaña → Mover o copiar → Crear una copia).",
    ],
    tips: [
      "Si el saldo en unidades queda negativo, la celda se marca en rojo: revisa los registros.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
