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

import type { PropiedadesConfig } from "./form";

export const build: TemplateBuild<PropiedadesConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith(`Propiedades ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const props = addSheet(wb, "Propiedades", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const mov = addSheet(wb, "Movimientos", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    {
      key: "income",
      title: "Ingresos",
      values: ["Alquiler", "Depósito recibido", "Venta", "Otros ingresos"],
    },
    { key: "expense", title: "Gastos", values: config.expenseCategories, spare: 10 },
    {
      key: "all",
      title: "Todas",
      values: [
        "Alquiler",
        "Depósito recibido",
        "Venta",
        "Otros ingresos",
        ...config.expenseCategories,
      ],
      spare: 10,
    },
  ]);
  const ex = config.example;
  const cat = (i: number) => config.expenseCategories[i] ?? config.expenseCategories[0]!;

  // Movimientos primero para conocer sus rangos (las propiedades los resumen)
  const propNames = `'Propiedades'!$A$5:$A$${4 + config.properties}`;
  addSheetHeader(mov, {
    title: `Ingresos y gastos ${y}`,
    subtitle: "Cada movimiento con su propiedad y categoría.",
    theme,
    width: 7,
  });
  const mt = addTable(mov, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "property",
        header: "Propiedad",
        kind: "list",
        width: 22,
        list: { source: propNames },
      },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 10,
        list: ["Ingreso", "Gasto"],
        align: "center",
      },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 26,
        list: { source: lists.source("all") },
      },
      { key: "detail", header: "Detalle", kind: "text", width: 28 },
      { key: "amount", header: "Monto", kind: "currency", width: 13 },
      { key: "receipt", header: "Comprobante", kind: "text", width: 14 },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 5),
            property: "Casa Col. Kennedy",
            type: "Ingreso",
            category: "Alquiler",
            detail: "Renta de enero",
            amount: 9000,
          },
          {
            date: exampleDate(y, 1, 8),
            property: "Local Barrio Abajo",
            type: "Ingreso",
            category: "Alquiler",
            detail: "Renta de enero",
            amount: 12000,
          },
          {
            date: exampleDate(y, 1, 20),
            property: "Casa Col. Kennedy",
            type: "Gasto",
            category: cat(2),
            detail: "Cambio de llave del lavamanos",
            amount: 650,
          },
          {
            date: exampleDate(y, 3, 30),
            property: "Casa Col. Kennedy",
            type: "Gasto",
            category: cat(0),
            detail: "Pago anual a la alcaldía",
            amount: 2400,
            receipt: "AMDC-5521",
          },
          {
            date: exampleDate(y, 2, 5),
            property: "Local Barrio Abajo",
            type: "Ingreso",
            category: "Alquiler",
            detail: "Renta de febrero",
            amount: 12000,
          },
        ]
      : undefined,
  });
  const M = (k: string) => mt.sheetRange(k);
  const inYear = (yc: string) =>
    `${M("date")},">="&DATE(${yc},1,1),${M("date")},"<="&DATE(${yc},12,31)`;

  addSheetHeader(props, {
    title: "Propiedades",
    subtitle: "Ingresos, gastos y rendimiento del año por propiedad.",
    theme,
    width: 9,
  });
  const top = addFields(props, {
    startRow: 3,
    labelCol: 8,
    valueCol: 9,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const Y = top.cell("year");
  addTable(props, {
    startRow: 4,
    columns: [
      { key: "name", header: "Propiedad", kind: "text", width: 24 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 14,
        list: ["Casa", "Apartamento", "Local", "Terreno", "Bodega", "Cuarto"],
      },
      { key: "address", header: "Dirección", kind: "text", width: 30 },
      { key: "value", header: "Valor estimado", kind: "currency", width: 15, total: "sum" },
      {
        key: "income",
        header: "Ingresos del año",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${M("amount")},${M("property")},${r.c("name")},${M("type")},"Ingreso",${inYear(Y)}))`,
      },
      {
        key: "expense",
        header: "Gastos del año",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${M("amount")},${M("property")},${r.c("name")},${M("type")},"Gasto",${inYear(Y)}))`,
      },
      {
        key: "net",
        header: "Resultado neto",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("name")}="","",${r.c("income")}-${r.c("expense")})`,
      },
      {
        key: "yield",
        header: "Rendimiento anual",
        kind: "formula",
        resultKind: "percent",
        width: 12,
        allowNegative: true,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("value")})=0),"",${r.c("net")}/${r.c("value")})`,
      },
      {
        key: "share",
        header: "% de los gastos",
        kind: "formula",
        resultKind: "percent",
        width: 12,
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(SUM(${r.col("expense")})=0,0,${r.c("expense")}/SUM(${r.col("expense")})))`,
      },
    ],
    rows: config.properties,
    theme,
    ctx,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            name: "Casa Col. Kennedy",
            type: "Casa",
            address: "Col. Kennedy, bloque 12",
            value: 1800000,
          },
          {
            name: "Local Barrio Abajo",
            type: "Local",
            address: "Barrio Abajo, frente al mercado",
            value: 2500000,
          },
        ]
      : undefined,
  });

  addSheetHeader(sum, {
    title: `Resumen ${y}`,
    subtitle: "Ingresos, gastos y resultado de todas las propiedades.",
    theme,
    width: 4,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const inMonth = (s?: string, e?: string) => `${M("date")},">="&${s},${M("date")},"<="&${e}`;
  const monthly = addMonthlySummary(sum, {
    startRow: 5,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${M("amount")},${M("type")},"Ingreso",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Gastos",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${M("amount")},${M("type")},"Gasto",${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Resultado",
        kind: "currency",
        formula: (k) => `${offsetCell(k.labelCell, 1)}-${offsetCell(k.labelCell, 2)}`,
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
        header: "Total del año",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${M("amount")},${M("category")},${k.labelCell},${M("type")},"Gasto",${inYear(f.cell("year"))}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 28,
  });

  for (const w of [props, mov, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Gastos de propiedades",
    description: "Sabe cuánto deja realmente cada casa o local después de sus gastos.",
    steps: [
      "En Propiedades escribe el nombre corto, tipo, dirección y valor estimado de cada inmueble.",
      "En Movimientos registra cada renta cobrada y cada gasto con su propiedad y categoría.",
      "Propiedades muestra ingresos, gastos, resultado neto y rendimiento del año de cada una.",
      "El Resumen presenta los totales por mes y por categoría de gasto.",
    ],
    tips: [
      "Guarda el recibo del impuesto de bienes inmuebles de la alcaldía con su número en Comprobante.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
