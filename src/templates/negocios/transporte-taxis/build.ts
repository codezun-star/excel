import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import type { TaxisConfig } from "./form";

export const build: TemplateBuild<TaxisConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const { month, year } = config;
  const title = titleWith(`Transporte — ${periodLabel(month, year)}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary, landscape: true });
  const daily = addSheet(wb, "Diario", { freezeRows: 4, tabColor: theme.primary, landscape: true });
  const mant = addSheet(wb, "Mantenimiento", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const d = (day: number) => exampleDate(year, month, day);

  // Unidades (en Resumen) — se definen primero para las listas
  addSheetHeader(sum, { title, subtitle: "Unidades y resultado del mes.", theme, width: 10 });
  const p = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: year },
      { key: "month", label: "Mes (1 a 12)", kind: "integer", value: month },
    ],
    theme,
    ctx,
  });
  const Y = p.cell("year");
  const M = p.cell("month");
  const unitStart = 7;
  const unitNames = `'Resumen'!$A$${unitStart + 1}:$A$${unitStart + config.units}`;

  addSheetHeader(daily, {
    title: "Registro diario",
    subtitle: "Una fila por unidad y día.",
    theme,
    width: 8,
  });
  const log = addTable(daily, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "unit", header: "Unidad", kind: "list", width: 14, list: { source: unitNames } },
      { key: "driver", header: "Conductor", kind: "text", width: 18 },
      { key: "income", header: "Ingreso o entrega", kind: "currency", width: 14, total: "sum" },
      { key: "fuel", header: "Combustible", kind: "currency", width: 13, total: "sum" },
      {
        key: "other",
        header: "Otros gastos",
        kind: "currency",
        width: 12,
        total: "sum",
        note: "Lavado, peaje, parqueo, multas…",
      },
      { key: "km", header: "Km recorridos", kind: "number", width: 11 },
      {
        key: "net",
        header: "Ganancia del día",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) =>
          `IF(${r.c("unit")}="","",N(${r.c("income")})-N(${r.c("fuel")})-N(${r.c("other")}))`,
      },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            date: d(1),
            unit: "Taxi 01",
            driver: "Pedro Ramos",
            income: 1200,
            fuel: 450,
            other: 50,
            km: 180,
          },
          { date: d(1), unit: "Taxi 02", driver: "Juan Cruz", income: 1000, fuel: 380, km: 150 },
          { date: d(2), unit: "Taxi 01", driver: "Pedro Ramos", income: 1100, fuel: 420, km: 170 },
        ]
      : undefined,
  });
  const L = (k: string) => log.sheetRange(k);

  addSheetHeader(mant, {
    title: "Mantenimiento",
    subtitle: "Cambios de aceite, llantas, frenos y reparaciones.",
    theme,
    width: 7,
  });
  const services = addTable(mant, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "unit", header: "Unidad", kind: "list", width: 14, list: { source: unitNames } },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 18,
        list: [
          "Cambio de aceite",
          "Llantas",
          "Frenos",
          "Batería",
          "Reparación",
          "Revisión",
          "Otro",
        ],
      },
      { key: "detail", header: "Detalle", kind: "text", width: 26 },
      { key: "cost", header: "Costo", kind: "currency", width: 12, total: "sum" },
      { key: "km", header: "Km actual", kind: "integer", width: 11 },
      { key: "nextKm", header: "Próximo servicio (km)", kind: "integer", width: 14 },
    ],
    rows: config.services,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: d(2),
            unit: "Taxi 02",
            type: "Cambio de aceite",
            detail: "Aceite y filtro",
            cost: 900,
            km: 98000,
            nextKm: 103000,
          },
        ]
      : undefined,
  });
  const S = (k: string) => services.sheetRange(k);
  const inMonth = (range: string) =>
    `${range},">="&DATE(${Y},${M},1),${range},"<="&EOMONTH(DATE(${Y},${M},1),0)`;

  const units = addTable(sum, {
    startRow: unitStart,
    columns: [
      { key: "unit", header: "Unidad", kind: "text", width: 14 },
      { key: "plate", header: "Placa", kind: "text", width: 11 },
      { key: "expected", header: "Entrega diaria esperada", kind: "currency", width: 14 },
      {
        key: "days",
        header: "Días trabajados",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        formula: (r) =>
          `IF(${r.c("unit")}="","",COUNTIFS(${L("unit")},${r.c("unit")},${inMonth(L("date"))}))`,
      },
      {
        key: "income",
        header: "Ingresos",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("unit")}="","",SUMIFS(${L("income")},${L("unit")},${r.c("unit")},${inMonth(L("date"))}))`,
      },
      {
        key: "fuel",
        header: "Combustible",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("unit")}="","",SUMIFS(${L("fuel")},${L("unit")},${r.c("unit")},${inMonth(L("date"))}))`,
      },
      {
        key: "other",
        header: "Otros gastos",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("unit")}="","",SUMIFS(${L("other")},${L("unit")},${r.c("unit")},${inMonth(L("date"))}))`,
      },
      {
        key: "maintenance",
        header: "Mantenimiento",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("unit")}="","",SUMIFS(${S("cost")},${S("unit")},${r.c("unit")},${inMonth(S("date"))}))`,
      },
      {
        key: "net",
        header: "Ganancia neta",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        allowNegative: true,
        formula: (r) =>
          `IF(${r.c("unit")}="","",${r.c("income")}-${r.c("fuel")}-${r.c("other")}-${r.c("maintenance")})`,
      },
      {
        key: "shortfall",
        header: "Faltó de la entrega",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("unit")}="",N(${r.c("expected")})=0),"",MAX(0,${r.c("expected")}*${r.c("days")}-${r.c("income")}))`,
      },
    ],
    rows: config.units,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          { unit: "Taxi 01", plate: "TAA 1001", expected: 1000 },
          { unit: "Taxi 02", plate: "TAA 1002", expected: 1000 },
        ]
      : undefined,
  });
  addFields(sum, {
    startRow: 3,
    labelCol: 4,
    valueCol: 6,
    labelSpan: 2,
    fields: [
      {
        key: "income",
        label: "Ingresos del mes",
        kind: "calc",
        resultKind: "currency",
        formula: () => units.total("income"),
      },
      {
        key: "net",
        label: "Ganancia neta del mes",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => units.total("net"),
      },
    ],
    theme,
    ctx,
  });
  const n = units.letter("net");
  highlightWhen(
    sum,
    `${n}${units.firstRow}:${n}${units.lastRow}`,
    `AND(${n}${units.firstRow}<>"",${n}${units.firstRow}<0)`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );

  await protectSheet(sum);
  await protectSheet(daily);
  await protectSheet(mant);

  addInstructionsSheet(wb, {
    title: "Control de taxis y transporte",
    description:
      "Sabe cuánto deja cada unidad al mes después de combustible, gastos y mantenimiento.",
    steps: [
      "En Resumen escribe tus unidades (por ejemplo «Taxi 01»), su placa y la entrega diaria esperada.",
      "En Diario registra cada día por unidad: ingreso o entrega del conductor, combustible y otros gastos.",
      "En Mantenimiento anota cada servicio con su costo y el kilometraje del próximo.",
      "El Resumen muestra por unidad los días trabajados, ingresos, gastos, ganancia neta y lo que faltó de la entrega.",
    ],
    tips: ["Revisa el kilometraje del próximo servicio para no pasarte del cambio de aceite."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
