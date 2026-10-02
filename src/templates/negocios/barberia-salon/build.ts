import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import { monthDayFormula } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { BarberiaConfig } from "./form";

const SERVICES: [string, number][] = [
  ["Corte de cabello", 150],
  ["Corte y barba", 220],
  ["Arreglo de barba", 100],
  ["Corte infantil", 120],
  ["Tinte", 600],
  ["Manicura", 250],
  ["Pedicura", 300],
  ["Peinado", 350],
];

export const build: TemplateBuild<BarberiaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const { month, year } = config;
  const title = titleWith(`Servicios — ${periodLabel(month, year)}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const reg = addSheet(wb, "Servicios del día", {
    freezeRows: 4,
    tabColor: theme.primary,
    landscape: true,
  });
  const res = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const cat = addSheet(wb, "Precios y equipo", { tabColor: theme.highlight });
  const ex = config.example;

  addSheetHeader(cat, {
    title: "Lista de precios y equipo",
    subtitle: "Edita servicios, precios y comisiones.",
    theme,
    width: 5,
  });
  const services = addTable(cat, {
    startRow: 4,
    columns: [
      { key: "service", header: "Servicio", kind: "text", width: 26 },
      { key: "price", header: "Precio", kind: "currency", width: 12 },
    ],
    rows: SERVICES.length + 22,
    theme,
    ctx,
    example: SERVICES.map(([service, price]) => ({ service, price })),
  });
  const team = addTable(cat, {
    startRow: 4,
    startCol: 4,
    columns: [
      { key: "name", header: "Estilista o barbero", kind: "text", width: 22 },
      {
        key: "rate",
        header: "% de comisión",
        kind: "percent",
        width: 14,
        fill: config.commission / 100,
      },
    ],
    rows: Math.max(config.stylists.length + 5, 10),
    theme,
    ctx,
    example: config.stylists.map((name) => ({ name })),
  });
  const svcNames = services.sheetRange("service");
  const svcPrices = services.sheetRange("price");
  const teamNames = team.sheetRange("name");
  const teamRates = team.sheetRange("rate");

  addSheetHeader(reg, {
    title,
    subtitle: "Un servicio por fila. El precio sale de la lista; puedes aplicar descuento.",
    theme,
    width: 10,
  });
  const d = (day: number) => exampleDate(year, month, day);
  const table = addTable(reg, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "stylist", header: "Estilista", kind: "list", width: 18, list: { source: teamNames } },
      { key: "service", header: "Servicio", kind: "list", width: 24, list: { source: svcNames } },
      { key: "client", header: "Cliente (opcional)", kind: "text", width: 18 },
      {
        key: "price",
        header: "Precio",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) =>
          `IF(${r.c("service")}="","",IFERROR(INDEX(${svcPrices},MATCH(${r.c("service")},${svcNames},0)),0))`,
      },
      { key: "discount", header: "Descuento", kind: "currency", width: 11, total: "sum" },
      { key: "tip", header: "Propina", kind: "currency", width: 10, total: "sum" },
      {
        key: "charged",
        header: "Cobrado",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("service")}="","",${r.c("price")}-N(${r.c("discount")})+N(${r.c("tip")}))`,
      },
      {
        key: "commission",
        header: "Comisión",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) =>
          `IF(OR(${r.c("service")}="",${r.c("stylist")}=""),"",ROUND((${r.c("price")}-N(${r.c("discount")}))*IFERROR(INDEX(${teamRates},MATCH(${r.c("stylist")},${teamNames},0)),0),2))`,
      },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 14,
        list: ["Efectivo", "Tarjeta", "Transferencia"],
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
            stylist: config.stylists[0],
            service: "Corte y barba",
            tip: 30,
            method: "Efectivo",
          },
          {
            date: d(1),
            stylist: config.stylists[1] ?? config.stylists[0],
            service: "Tinte",
            discount: 50,
            method: "Tarjeta",
          },
          {
            date: d(2),
            stylist: config.stylists[0],
            service: "Corte de cabello",
            method: "Efectivo",
          },
        ]
      : undefined,
  });
  const R = (k: string) => table.sheetRange(k);

  addSheetHeader(res, {
    title: `Resumen — ${periodLabel(month, year)}`,
    subtitle: "Por estilista y por día.",
    theme,
    width: 7,
  });
  const p = addFields(res, {
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
  const inMonth = `${R("date")},">="&DATE(${Y},${M},1),${R("date")},"<="&EOMONTH(DATE(${Y},${M},1),0)`;
  const byStylist = addTable(res, {
    startRow: 7,
    columns: [
      {
        key: "name",
        header: "Estilista",
        kind: "formula",
        width: 20,
        formula: (r) =>
          `IF(INDEX(${teamNames},${r.index + 1})="","",INDEX(${teamNames},${r.index + 1}))`,
      },
      {
        key: "count",
        header: "Servicios",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",COUNTIFS(${R("stylist")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "sales",
        header: "Ventas (sin propina)",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${R("charged")},${R("stylist")},${r.c("name")},${inMonth})-SUMIFS(${R("tip")},${R("stylist")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "commission",
        header: "Comisión",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${R("commission")},${R("stylist")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "tips",
        header: "Propinas",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${R("tip")},${R("stylist")},${r.c("name")},${inMonth}))`,
      },
      {
        key: "pay",
        header: "A pagar",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("name")}="","",${r.c("commission")}+${r.c("tips")})`,
      },
    ],
    rows: Math.max(config.stylists.length + 5, 10),
    theme,
    ctx,
    totals: { label: "Total" },
  });
  addTable(res, {
    startRow: byStylist.totalRow! + 3,
    columns: [
      {
        key: "date",
        header: "Día",
        kind: "formula",
        resultKind: "date",
        width: 20,
        formula: (r) => monthDayFormula(r.prev("date"), Y, M),
      },
      {
        key: "count",
        header: "Servicios",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",COUNTIFS(${R("date")},${r.c("date")},${R("service")},"<>"))`,
      },
      {
        key: "charged",
        header: "Cobrado",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("date")}="","",SUMIFS(${R("charged")},${R("date")},${r.c("date")}))`,
      },
    ],
    rows: 31,
    theme,
    ctx,
    totals: { label: "Total del mes" },
  });

  await protectSheet(reg);
  await protectSheet(res);
  await protectSheet(cat);

  addInstructionsSheet(wb, {
    title: "Control de barbería y salón",
    description: "Lleva los servicios de cada día y sabe cuánto pagar a cada estilista.",
    steps: [
      "En «Precios y equipo» revisa tus servicios, precios y el porcentaje de comisión de cada estilista.",
      "En «Servicios del día» registra cada servicio: fecha, estilista y servicio. El precio aparece solo.",
      "Anota descuentos y propinas; el cobrado y la comisión se calculan solos.",
      "En Resumen ves lo que corresponde pagar a cada estilista (comisión + propinas) y las ventas por día.",
    ],
    tips: [
      "La comisión se calcula sobre el precio menos el descuento; las propinas van completas al estilista.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
