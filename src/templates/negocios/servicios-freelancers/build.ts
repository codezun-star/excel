import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId, fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { FreelanceConfig } from "./form";

export const build: TemplateBuild<FreelanceConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Proyectos y cobros", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const projWs = addSheet(wb, "Proyectos", {
    freezeRows: 8,
    tabColor: theme.primary,
    landscape: true,
  });
  const hoursWs = addSheet(wb, "Horas", { freezeRows: 4, tabColor: theme.primary });
  const movWs = addSheet(wb, "Pagos y gastos", { freezeRows: 4, tabColor: theme.primary });
  const cliWs = addSheet(wb, "Clientes", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const pStart = 8;
  const projIds = `'Proyectos'!$A$${pStart + 1}:$A$${pStart + config.projects}`;
  const projNames = `'Proyectos'!$C$${pStart + 1}:$C$${pStart + config.projects}`;

  addSheetHeader(hoursWs, {
    title: "Horas trabajadas",
    subtitle: "Elige el proyecto y anota las horas de cada tarea.",
    theme,
    width: 5,
  });
  const hours = addTable(hoursWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "project", header: "Proyecto", kind: "list", width: 12, list: { source: projIds } },
      {
        key: "name",
        header: "Nombre del proyecto",
        kind: "formula",
        width: 26,
        formula: (r) =>
          `IF(${r.c("project")}="","",IFERROR(INDEX(${projNames},MATCH(${r.c("project")},${projIds},0)),""))`,
      },
      { key: "task", header: "Tarea", kind: "text", width: 30 },
      { key: "hours", header: "Horas", kind: "number", width: 9, total: "sum" },
    ],
    rows: config.hours,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total de horas" },
    example: ex
      ? [
          { date: fromToday(-10), project: "PR-001", task: "Diseño de pantallas", hours: 6 },
          { date: fromToday(-8), project: "PR-001", task: "Ajustes del cliente", hours: 4 },
        ]
      : undefined,
  });
  const H = (k: string) => hours.sheetRange(k);

  addSheetHeader(movWs, {
    title: "Pagos y gastos",
    subtitle: "Pagos recibidos del cliente y gastos del proyecto.",
    theme,
    width: 5,
  });
  const mov = addTable(movWs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "project", header: "Proyecto", kind: "list", width: 12, list: { source: projIds } },
      { key: "type", header: "Tipo", kind: "list", width: 16, list: ["Pago recibido", "Gasto"] },
      { key: "detail", header: "Detalle", kind: "text", width: 30 },
      { key: "amount", header: "Monto", kind: "currency", width: 13 },
    ],
    rows: config.movements,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(-12),
            project: "PR-001",
            type: "Pago recibido",
            detail: "Anticipo 50 %",
            amount: 2500,
          },
          {
            date: fromToday(-5),
            project: "PR-002",
            type: "Pago recibido",
            detail: "Pago completo",
            amount: 8000,
          },
          {
            date: fromToday(-5),
            project: "PR-002",
            type: "Gasto",
            detail: "Licencia de fotos",
            amount: 600,
          },
        ]
      : undefined,
  });
  const V = (k: string) => mov.sheetRange(k);

  addSheetHeader(projWs, {
    title,
    subtitle: "Cada proyecto con su forma de cobro. Horas, pagos y gastos se suman solos.",
    theme,
    width: 14,
  });
  const projects = addTable(projWs, {
    startRow: pStart,
    columns: [
      {
        key: "id",
        header: "Código",
        kind: "formula",
        width: 9,
        align: "center",
        formula: (r) => correlativeId("PR-", r.c("client"), r.index),
      },
      { key: "client", header: "Cliente", kind: "text", width: 20 },
      { key: "name", header: "Proyecto", kind: "text", width: 26 },
      {
        key: "mode",
        header: "Forma de cobro",
        kind: "list",
        width: 13,
        list: ["Por hora", "Precio fijo"],
      },
      {
        key: "rate",
        header: "Tarifa por hora",
        kind: "currency",
        width: 12,
        fill: config.defaultRate,
      },
      { key: "fixed", header: "Precio fijo", kind: "currency", width: 12 },
      {
        key: "hours",
        header: "Horas",
        kind: "formula",
        resultKind: "number",
        width: 8,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",SUMIFS(${H("hours")},${H("project")},${r.c("id")}))`,
      },
      {
        key: "billable",
        header: "A cobrar",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("id")}="","",IF(${r.c("mode")}="Precio fijo",N(${r.c("fixed")}),ROUND(${r.c("hours")}*N(${r.c("rate")}),2)))`,
      },
      {
        key: "paid",
        header: "Cobrado",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("id")}="","",SUMIFS(${V("amount")},${V("project")},${r.c("id")},${V("type")},"Pago recibido"))`,
      },
      {
        key: "pending",
        header: "Pendiente",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("id")}="","",MAX(0,${r.c("billable")}-${r.c("paid")}))`,
      },
      {
        key: "expenses",
        header: "Gastos",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("id")}="","",SUMIFS(${V("amount")},${V("project")},${r.c("id")},${V("type")},"Gasto"))`,
      },
      {
        key: "profit",
        header: "Ganancia",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        allowNegative: true,
        formula: (r) => `IF(${r.c("id")}="","",${r.c("billable")}-${r.c("expenses")})`,
      },
      {
        key: "effective",
        header: "Ganancia por hora",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("id")}="",N(${r.c("hours")})=0),"",ROUND(${r.c("profit")}/${r.c("hours")},2))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 12,
        list: ["En curso", "Terminado", "Pausado"],
      },
    ],
    rows: config.projects,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            client: "Café El Aroma",
            name: "Diseño de sitio web",
            mode: "Por hora",
            rate: 500,
            status: "En curso",
          },
          {
            client: "Hotel Brisas",
            name: "Sesión de fotos",
            mode: "Precio fijo",
            fixed: 8000,
            status: "Terminado",
          },
        ]
      : undefined,
  });
  const PR = (k: string) => projects.sheetRange(k);
  addFields(projWs, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "pending",
        label: "Pendiente de cobro",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => projects.total("pending"),
      },
      {
        key: "profit",
        label: "Ganancia total",
        kind: "calc",
        resultKind: "currency",
        formula: () => projects.total("profit"),
      },
      {
        key: "hours",
        label: "Horas registradas",
        kind: "calc",
        resultKind: "number",
        formula: () => projects.total("hours"),
      },
    ],
    theme,
    ctx,
  });
  const pe = projects.letter("pending");
  highlightWhen(
    projWs,
    `${pe}${projects.firstRow}:${pe}${projects.lastRow}`,
    `N(${pe}${projects.firstRow})>0`,
    { fill: theme.warningSoft, bold: true },
    1,
  );

  addSheetHeader(cliWs, {
    title: "Clientes",
    subtitle: "Escribe el nombre igual que en Proyectos.",
    theme,
    width: 5,
  });
  addTable(cliWs, {
    startRow: 4,
    columns: [
      { key: "name", header: "Cliente", kind: "text", width: 24 },
      {
        key: "billable",
        header: "Facturado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${PR("billable")},${PR("client")},${r.c("name")}))`,
      },
      {
        key: "paid",
        header: "Cobrado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${PR("paid")},${PR("client")},${r.c("name")}))`,
      },
      {
        key: "pending",
        header: "Pendiente",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${PR("pending")},${PR("client")},${r.c("name")}))`,
      },
      {
        key: "profit",
        header: "Ganancia",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        allowNegative: true,
        formula: (r) =>
          `IF(${r.c("name")}="","",SUMIFS(${PR("profit")},${PR("client")},${r.c("name")}))`,
      },
    ],
    rows: config.clients,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex ? [{ name: "Café El Aroma" }, { name: "Hotel Brisas" }] : undefined,
  });

  for (const w of [projWs, hoursWs, movWs, cliWs]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Control de proyectos para freelancers",
    description: "Sabe cuánto te deben, cuánto ganas por proyecto y cuánto vale realmente tu hora.",
    steps: [
      "En Proyectos escribe cliente, nombre y forma de cobro (por hora o precio fijo). El código se asigna solo.",
      "En Horas registra el tiempo de cada tarea eligiendo el código del proyecto.",
      "En «Pagos y gastos» registra los pagos del cliente y los gastos del proyecto.",
      "El monto a cobrar, lo pendiente, la ganancia y la ganancia por hora se calculan solos; en Clientes ves el total por cliente.",
    ],
    tips: [
      "En proyectos de precio fijo registra igual tus horas: la «Ganancia por hora» te dirá si cobraste bien.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
