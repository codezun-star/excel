import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import type { TemplateBuild } from "@/templates/types";

import type { ComprarConfig } from "./form";

export const build: TemplateBuild<ComprarConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = "¿Comprar o alquilar vivienda?";
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Comparación", {
    freezeRows: 21,
    tabColor: theme.primary,
    landscape: true,
  });

  addSheetHeader(ws, {
    title,
    subtitle: "Cambia los datos de la izquierda: la tabla compara 30 años.",
    theme,
    width: 10,
  });
  const f = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      { key: "price", label: "Precio de la vivienda", kind: "currency", value: config.price },
      { key: "downPct", label: "Prima", kind: "percent", value: config.downPct / 100 },
      {
        key: "down",
        label: "Monto de la prima",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `ROUND(${ref("price")}*${ref("downPct")},2)`,
      },
      {
        key: "loan",
        label: "Monto del préstamo",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `${ref("price")}-${ref("down")}`,
      },
      { key: "rate", label: "Tasa anual del préstamo", kind: "percent", value: config.rate / 100 },
      { key: "years", label: "Plazo (años)", kind: "integer", value: config.years },
      {
        key: "payment",
        label: "Cuota mensual",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (ref) =>
          `IF(${ref("rate")}=0,${ref("loan")}/(${ref("years")}*12),ROUND(PMT(${ref("rate")}/12,${ref("years")}*12,-${ref("loan")}),2))`,
      },
      {
        key: "ownPct",
        label: "Seguros, mantenimiento e impuestos al año",
        kind: "percent",
        value: config.ownCostsPct / 100,
      },
      { key: "appr", label: "Plusvalía anual", kind: "percent", value: config.appreciation / 100 },
      { key: "rent", label: "Alquiler mensual", kind: "currency", value: config.rent },
      {
        key: "rentInc",
        label: "Aumento anual del alquiler",
        kind: "percent",
        value: config.rentIncrease / 100,
      },
      {
        key: "ret",
        label: "Rendimiento anual de inversiones",
        kind: "percent",
        value: config.investReturn / 100,
      },
    ],
    theme,
    ctx,
  });
  const c = f.cell;
  const table = addTable(ws, {
    startRow: 21,
    columns: [
      {
        key: "year",
        header: "Año",
        kind: "formula",
        resultKind: "integer",
        width: 7,
        align: "center",
        formula: (r) => String(r.index + 1),
      },
      {
        key: "value",
        header: "Valor de la vivienda",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) => `ROUND(${c("price")}*(1+${c("appr")})^${r.c("year")},2)`,
      },
      {
        key: "buyCost",
        header: "Costo de comprar en el año",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) =>
          `ROUND(IF(${r.c("year")}<=${c("years")},${c("payment")}*12,0)+${c("ownPct")}*${c("price")}*(1+${c("appr")})^(${r.c("year")}-1),2)`,
      },
      {
        key: "balance",
        header: "Saldo del préstamo",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) =>
          `IF(${r.c("year")}>=${c("years")},0,IF(${c("rate")}=0,${c("loan")}*(1-${r.c("year")}/${c("years")}),ROUND(PV(${c("rate")}/12,(${c("years")}-${r.c("year")})*12,-${c("payment")}),2)))`,
      },
      {
        key: "buyWealth",
        header: "Patrimonio comprando",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) => `${r.c("value")}-${r.c("balance")}`,
      },
      {
        key: "rentCost",
        header: "Alquiler del año",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) => `ROUND(${c("rent")}*12*(1+${c("rentInc")})^(${r.c("year")}-1),2)`,
      },
      {
        key: "rentWealth",
        header: "Patrimonio alquilando (inversiones)",
        kind: "formula",
        resultKind: "currency",
        width: 17,
        allowNegative: true,
        formula: (r) => {
          const prev = r.prev("rentWealth");
          return `ROUND(${prev ?? c("down")}*(1+${c("ret")})+(${r.c("buyCost")}-${r.c("rentCost")}),2)`;
        },
      },
      {
        key: "best",
        header: "Conviene",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) => `IF(${r.c("buyWealth")}>=${r.c("rentWealth")},"Comprar","Alquilar")`,
      },
    ],
    rows: 30,
    theme,
    ctx,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 5,
    valueCol: 7,
    labelSpan: 2,
    title: "Resultado al final del plazo",
    fields: [
      {
        key: "buy",
        label: "Patrimonio comprando",
        kind: "calc",
        resultKind: "currency",
        formula: () => `INDEX(${table.range("buyWealth")},MIN(30,${c("years")}))`,
      },
      {
        key: "rent",
        label: "Patrimonio alquilando",
        kind: "calc",
        resultKind: "currency",
        formula: () => `INDEX(${table.range("rentWealth")},MIN(30,${c("years")}))`,
      },
      {
        key: "best",
        label: "Conviene",
        kind: "calc",
        emphasis: true,
        formula: (ref) => `IF(${ref("buy")}>=${ref("rent")},"Comprar","Alquilar")`,
      },
    ],
    theme,
    ctx,
  });
  const b = table.letter("best");
  highlightWhen(
    ws,
    `${b}${table.firstRow}:${b}${table.lastRow}`,
    `${b}${table.firstRow}="Comprar"`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    ws,
    `${b}${table.firstRow}:${b}${table.lastRow}`,
    `${b}${table.firstRow}="Alquilar"`,
    { fill: theme.warningSoft, bold: true },
    2,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "¿Comprar o alquilar vivienda?",
    description:
      "Compara con números qué te deja más patrimonio: comprar con préstamo o alquilar e invertir.",
    steps: [
      "Escribe el precio de la vivienda, la prima, la tasa y el plazo del préstamo.",
      "Ajusta los costos anuales de ser dueño (seguros, mantenimiento, impuestos) y la plusvalía esperada.",
      "Escribe el alquiler de una vivienda parecida, su aumento anual y cuánto rendirían tus inversiones.",
      "La tabla compara cada año el patrimonio comprando (valor − saldo del préstamo) contra alquilando (prima invertida + lo que te ahorras cada año).",
    ],
    tips: [
      "Es una estimación: la plusvalía y el rendimiento de las inversiones no están garantizados.",
      "Si el resultado cambia de un año a otro, piensa cuántos años vivirías en esa casa.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
