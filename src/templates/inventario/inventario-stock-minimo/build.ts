import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { rangeAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { InventarioConfig } from "./form";

export const build: TemplateBuild<InventarioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({ title: titleWith("Inventario", config.businessName), ctx, options });
  const ws = addSheet(wb, "Inventario", {
    freezeRows: 8,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const mov = addSheet(wb, "Movimientos", { freezeRows: 4, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "categories", title: "Categorías", values: config.categories },
    { key: "units", title: "Unidades", values: config.units },
  ]);
  const productRowStart = 8;
  const codes = sheetRef(
    ws.name,
    rangeAddr(1, productRowStart + 1, 1, productRowStart + config.products, true),
  );
  const names = sheetRef(
    ws.name,
    rangeAddr(2, productRowStart + 1, 2, productRowStart + config.products, true),
  );

  addSheetHeader(mov, {
    title: "Movimientos de inventario",
    subtitle: "Registra cada entrada (compra) o salida (venta, consumo, merma).",
    theme,
    width: 6,
  });
  const ex = config.example;
  const movements = addTable(mov, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "code", header: "Código", kind: "list", width: 12, list: { source: codes } },
      {
        key: "product",
        header: "Producto",
        kind: "formula",
        width: 30,
        formula: (r) =>
          `IF(${r.c("code")}="","",IFERROR(INDEX(${names},MATCH(${r.c("code")},${codes},0)),"Código no existe"))`,
      },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 10,
        list: ["Entrada", "Salida"],
        align: "center",
      },
      { key: "qty", header: "Cantidad", kind: "number", width: 10 },
      { key: "note", header: "Referencia / nota", kind: "text", width: 28 },
    ],
    rows: config.movements,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: "2026-03-01",
            code: "P001",
            type: "Entrada",
            qty: 24,
            note: "Compra a Distribuidora Central",
          },
          { date: "2026-03-02", code: "P001", type: "Salida", qty: 18, note: "Ventas" },
          { date: "2026-03-02", code: "P002", type: "Salida", qty: 40, note: "Ventas" },
          { date: "2026-03-03", code: "P003", type: "Salida", qty: 12, note: "Ventas" },
        ]
      : undefined,
  });

  addSheetHeader(ws, {
    title: titleWith("Control de inventario", config.businessName),
    subtitle: "Las existencias se calculan con el stock inicial y los movimientos.",
    theme,
    width: 13,
  });
  const table = addTable(ws, {
    startRow: productRowStart,
    columns: [
      { key: "code", header: "Código", kind: "text", width: 11 },
      { key: "name", header: "Producto", kind: "text", width: 30 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 16,
        list: { source: lists.source("categories") },
      },
      {
        key: "unit",
        header: "Unidad",
        kind: "list",
        width: 10,
        list: { source: lists.source("units") },
      },
      { key: "cost", header: "Costo unitario", kind: "currency", width: 13 },
      { key: "price", header: "Precio de venta", kind: "currency", width: 13 },
      { key: "initial", header: "Stock inicial", kind: "number", width: 10 },
      {
        key: "in",
        header: "Entradas",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) =>
          `IF(${r.c("code")}="","",SUMIFS(${movements.sheetRange("qty")},${movements.sheetRange("code")},${r.c("code")},${movements.sheetRange("type")},"Entrada"))`,
      },
      {
        key: "out",
        header: "Salidas",
        kind: "formula",
        resultKind: "number",
        width: 10,
        formula: (r) =>
          `IF(${r.c("code")}="","",SUMIFS(${movements.sheetRange("qty")},${movements.sheetRange("code")},${r.c("code")},${movements.sheetRange("type")},"Salida"))`,
      },
      {
        key: "stock",
        header: "Existencia",
        kind: "formula",
        resultKind: "number",
        width: 11,
        formula: (r) => `IF(${r.c("code")}="","",${r.c("initial")}+${r.c("in")}-${r.c("out")})`,
      },
      { key: "min", header: "Stock mínimo", kind: "number", width: 10 },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("code")}="","",IF(${r.c("stock")}<=0,"Agotado",IF(${r.c("stock")}<=${r.c("min")},"Reordenar","OK")))`,
      },
      {
        key: "value",
        header: "Valor al costo",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) => `IF(${r.c("code")}="","",MAX(0,${r.c("stock")})*${r.c("cost")})`,
      },
    ],
    rows: config.products,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            code: "P001",
            name: "Arroz 5 lb",
            category: config.categories[0],
            unit: config.units[2] ?? config.units[0],
            cost: 52,
            price: 62,
            initial: 10,
            min: 10,
          },
          {
            code: "P002",
            name: "Gaseosa 2 L",
            category: config.categories[1] ?? config.categories[0],
            unit: config.units[0],
            cost: 38,
            price: 48,
            initial: 60,
            min: 24,
          },
          {
            code: "P003",
            name: "Leche entera 1 L",
            category: config.categories[2] ?? config.categories[0],
            unit: config.units[0],
            cost: 26,
            price: 32,
            initial: 12,
            min: 6,
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
        key: "value",
        label: "Valor del inventario (al costo)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `SUM(${table.range("value")})`,
      },
      {
        key: "reorder",
        label: "Productos para reordenar",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${table.range("status")},"Reordenar")`,
      },
      {
        key: "out",
        label: "Productos agotados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${table.range("status")},"Agotado")`,
      },
    ],
    theme,
    ctx,
  });
  const st = `$${table.letter("status")}${table.firstRow}`;
  const area = `A${table.firstRow}:M${table.lastRow}`;
  highlightWhen(ws, area, `${st}="Agotado"`, { fill: theme.dangerSoft, color: theme.danger }, 1);
  highlightWhen(ws, area, `${st}="Reordenar"`, { fill: theme.warningSoft }, 2);
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Inventario con stock mínimo",
    description: "Lleva tus existencias al día y sabe qué productos debes volver a comprar.",
    steps: [
      "En Inventario registra cada producto con su código, costo, precio, stock inicial y stock mínimo.",
      "En Movimientos registra cada entrada (compras) y salida (ventas, consumo o mermas) usando el código del producto.",
      "Las existencias, el estado y el valor del inventario se actualizan solos.",
      "Los productos en ámbar están por debajo del mínimo; los rojos están agotados.",
    ],
    tips: [
      "Haz un conteo físico periódico y registra la diferencia como entrada o salida con la nota 'Ajuste'.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
