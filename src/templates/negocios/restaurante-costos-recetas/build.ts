import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { RecetasConfig } from "./form";

export const build: TemplateBuild<RecetasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Costos de recetas", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const dishesWs = addSheet(wb, "Platillos", {
    freezeRows: 9,
    tabColor: theme.primary,
    landscape: true,
  });
  const recipesWs = addSheet(wb, "Recetas", { freezeRows: 4, tabColor: theme.primary });
  const ingWs = addSheet(wb, "Insumos", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const ex = config.example;
  const tax = ctx.taxes.salesTax;
  const stdRate = tax.rates.find((r) => r.id === "standard")?.rate ?? 0;

  addSheetHeader(ingWs, {
    title: "Insumos",
    subtitle: "Costo de compra, cuántas unidades de uso trae y la merma.",
    theme,
    width: 8,
  });
  const ing = addTable(ingWs, {
    startRow: 4,
    columns: [
      { key: "name", header: "Insumo", kind: "text", width: 26 },
      { key: "buyUnit", header: "Unidad de compra", kind: "text", width: 14 },
      { key: "buyCost", header: "Costo de compra", kind: "currency", width: 13 },
      { key: "useUnit", header: "Unidad de uso", kind: "text", width: 12 },
      {
        key: "factor",
        header: "Unidades de uso por compra",
        kind: "number",
        width: 14,
        note: "Ejemplo: una libra trae 16 onzas; un cartón trae 30 huevos.",
      },
      {
        key: "waste",
        header: "Merma",
        kind: "percent",
        width: 9,
        note: "Lo que se pierde al limpiar o preparar.",
      },
      {
        key: "unitCost",
        header: "Costo por unidad de uso",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        numFmt: "#,##0.0000",
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("factor")})=0),"",${r.c("buyCost")}/${r.c("factor")}/(1-MIN(0.95,N(${r.c("waste")}))))`,
      },
    ],
    rows: config.ingredients,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            name: "Pechuga de pollo",
            buyUnit: "Libra",
            buyCost: 60,
            useUnit: "Onza",
            factor: 16,
            waste: 0.1,
          },
          { name: "Arroz", buyUnit: "Libra", buyCost: 14, useUnit: "Onza", factor: 16, waste: 0 },
          {
            name: "Frijoles rojos",
            buyUnit: "Libra",
            buyCost: 22,
            useUnit: "Onza",
            factor: 16,
            waste: 0,
          },
          {
            name: "Plátano maduro",
            buyUnit: "Unidad",
            buyCost: 8,
            useUnit: "Unidad",
            factor: 1,
            waste: 0,
          },
          {
            name: "Queso seco",
            buyUnit: "Libra",
            buyCost: 80,
            useUnit: "Onza",
            factor: 16,
            waste: 0,
          },
        ]
      : undefined,
  });
  const ingNames = ing.sheetRange("name");
  const ingCosts = ing.sheetRange("unitCost");
  const ingUnits = ing.sheetRange("useUnit");

  addSheetHeader(dishesWs, {
    title,
    subtitle: "Precio actual, costo por porción y precio sugerido de cada platillo.",
    theme,
    width: 10,
  });
  const params = addFields(dishesWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "target",
        label: "Food cost objetivo",
        kind: "percent",
        value: config.targetFoodCost / 100,
      },
      { key: "rate", label: `Tasa de ${tax.name}`, kind: "percent", value: stdRate },
      {
        key: "tolerance",
        label: "Tolerancia sobre el objetivo",
        kind: "percent",
        value: 0.05,
        note: "Si el food cost pasa el objetivo más esta tolerancia, se sugiere subir el precio.",
      },
    ],
    theme,
    ctx,
  });
  const dishStart = 9;
  const dishNames = `'Platillos'!$A$${dishStart + 1}:$A$${dishStart + config.dishes}`;

  addSheetHeader(recipesWs, {
    title: "Recetas",
    subtitle: "Una fila por ingrediente de cada platillo, con la cantidad para UNA porción.",
    theme,
    width: 6,
  });
  const recipe = addTable(recipesWs, {
    startRow: 4,
    columns: [
      { key: "dish", header: "Platillo", kind: "list", width: 26, list: { source: dishNames } },
      { key: "ingredient", header: "Insumo", kind: "list", width: 26, list: { source: ingNames } },
      { key: "qty", header: "Cantidad por porción", kind: "number", width: 12 },
      {
        key: "unit",
        header: "Unidad",
        kind: "formula",
        width: 10,
        formula: (r) =>
          `IF(${r.c("ingredient")}="","",IFERROR(INDEX(${ingUnits},MATCH(${r.c("ingredient")},${ingNames},0)),""))`,
      },
      {
        key: "cost",
        header: "Costo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(${r.c("ingredient")}="","",ROUND(N(${r.c("qty")})*IFERROR(INDEX(${ingCosts},MATCH(${r.c("ingredient")},${ingNames},0)),0),2))`,
      },
    ],
    rows: config.recipeLines,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          { dish: "Plato típico", ingredient: "Pechuga de pollo", qty: 6 },
          { dish: "Plato típico", ingredient: "Arroz", qty: 4 },
          { dish: "Plato típico", ingredient: "Frijoles rojos", qty: 3 },
          { dish: "Plato típico", ingredient: "Plátano maduro", qty: 1 },
          { dish: "Baleada sencilla", ingredient: "Frijoles rojos", qty: 2 },
          { dish: "Baleada sencilla", ingredient: "Queso seco", qty: 1 },
        ]
      : undefined,
  });
  const rDish = recipe.sheetRange("dish");
  const rCost = recipe.sheetRange("cost");

  const dishes = addTable(dishesWs, {
    startRow: dishStart,
    columns: [
      { key: "name", header: "Platillo", kind: "text", width: 26 },
      { key: "category", header: "Categoría", kind: "text", width: 14 },
      {
        key: "cost",
        header: "Costo por porción",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) => `IF(${r.c("name")}="","",SUMIFS(${rCost},${rDish},${r.c("name")}))`,
      },
      { key: "price", header: "Precio actual (con impuesto)", kind: "currency", width: 14 },
      {
        key: "net",
        header: "Precio sin impuesto",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",${r.c("price")}=""),"",ROUND(${r.c("price")}/(1+${params.cell("rate")}),2))`,
      },
      {
        key: "foodCost",
        header: "Food cost",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("net")}="",N(${r.c("net")})=0),"",${r.c("cost")}/${r.c("net")})`,
      },
      {
        key: "margin",
        header: "Margen por porción",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        allowNegative: true,
        formula: (r) => `IF(${r.c("net")}="","",${r.c("net")}-${r.c("cost")})`,
      },
      {
        key: "suggested",
        header: "Precio sugerido sin impuesto",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(OR(${r.c("name")}="",N(${r.c("cost")})=0),"",ROUND(${r.c("cost")}/${params.cell("target")},2))`,
      },
      {
        key: "suggestedTax",
        header: "Precio sugerido con impuesto",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(${r.c("suggested")}="","",ROUND(${r.c("suggested")}*(1+${params.cell("rate")}),2))`,
      },
      {
        key: "status",
        header: "Revisión",
        kind: "formula",
        width: 14,
        align: "center",
        formula: (r) =>
          `IF(${r.c("foodCost")}="","",IF(${r.c("foodCost")}>${params.cell("target")}+${params.cell("tolerance")},"Subir precio",IF(${r.c("foodCost")}<${params.cell("target")}-2*${params.cell("tolerance")},"Muy rentable","Bien")))`,
      },
    ],
    rows: config.dishes,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          { name: "Plato típico", category: "Almuerzo", price: 140 },
          { name: "Baleada sencilla", category: "Desayuno", price: 25 },
        ]
      : undefined,
  });
  const s = dishes.letter("status");
  highlightWhen(
    dishesWs,
    `${s}${dishes.firstRow}:${s}${dishes.lastRow}`,
    `${s}${dishes.firstRow}="Subir precio"`,
    { fill: theme.dangerSoft, color: theme.danger, bold: true },
    1,
  );
  highlightWhen(
    dishesWs,
    `${s}${dishes.firstRow}:${s}${dishes.lastRow}`,
    `${s}${dishes.firstRow}="Muy rentable"`,
    { fill: theme.okSoft },
    2,
  );

  await protectSheet(dishesWs);
  await protectSheet(recipesWs);
  await protectSheet(ingWs);

  addInstructionsSheet(wb, {
    title: "Costos de recetas",
    description:
      "Sabe cuánto te cuesta cada platillo y a qué precio venderlo para ganar lo que necesitas.",
    steps: [
      "En Insumos registra cada ingrediente: costo de compra, cuántas unidades de uso trae (onzas, unidades) y su merma.",
      "En Platillos escribe el nombre, la categoría y el precio actual (con impuesto incluido).",
      "En Recetas agrega una fila por ingrediente de cada platillo con la cantidad para UNA porción.",
      "El costo por porción, el food cost, el margen y el precio sugerido se calculan solos.",
    ],
    tips: [
      "Actualiza los costos de compra cada vez que suban los precios del mercado: todos los platillos se recalculan.",
      "El food cost se calcula sobre el precio sin impuesto.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
