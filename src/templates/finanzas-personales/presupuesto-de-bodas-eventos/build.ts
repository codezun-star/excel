import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { EventoConfig } from "./form";

export const build: TemplateBuild<EventoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = config.eventName || "Presupuesto del evento";
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Presupuesto", {
    freezeRows: 10,
    tabColor: theme.primary,
    landscape: true,
  });
  const gw = addSheet(wb, "Invitados", { freezeRows: 6, tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "cat", title: "Rubros", values: config.categories },
    {
      key: "group",
      title: "Grupos de invitados",
      values: ["Familia", "Amigos", "Trabajo", "Iglesia", "Otros"],
    },
  ]);
  const ex = config.example;
  const cat = (i: number) => config.categories[i] ?? config.categories[0] ?? "";

  addSheetHeader(gw, {
    title: "Invitados",
    subtitle: "Una fila por familia o grupo, con el número de personas.",
    theme,
    width: 6,
  });
  const guests = addTable(gw, {
    startRow: 6,
    columns: [
      { key: "name", header: "Invitado o familia", kind: "text", width: 28 },
      {
        key: "group",
        header: "Grupo",
        kind: "list",
        width: 14,
        list: { source: lists.source("group") },
      },
      { key: "people", header: "Personas", kind: "integer", width: 10, total: "sum", fill: null },
      {
        key: "confirmed",
        header: "Confirmó",
        kind: "list",
        width: 11,
        list: ["Sí", "No", "Pendiente"],
        align: "center",
      },
      { key: "table", header: "Mesa", kind: "text", width: 8, align: "center" },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
    ],
    rows: config.guests,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Total invitados" },
    example: ex
      ? [
          { name: "Familia López", group: "Familia", people: 4, confirmed: "Sí", table: "1" },
          { name: "Carlos y Sofía", group: "Amigos", people: 2, confirmed: "Pendiente" },
          { name: "Equipo de oficina", group: "Trabajo", people: 6, confirmed: "Sí", table: "5" },
        ]
      : undefined,
  });
  const G = (k: string) => guests.sheetRange(k);
  addFields(gw, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "confirmed",
        label: "Personas confirmadas",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: () => `SUMIFS(${guests.range("people")},${guests.range("confirmed")},"Sí")`,
      },
    ],
    theme,
    ctx,
  });

  addSheetHeader(ws, {
    title,
    subtitle: config.eventDate
      ? `Fecha del evento: ${config.eventDate.split("-").reverse().join("/")}`
      : "Presupuesto, proveedores y pagos.",
    theme,
    width: 11,
  });
  const f = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [{ key: "budget", label: "Presupuesto total", kind: "currency", value: config.budget }],
    theme,
    ctx,
  });
  const items = addTable(ws, {
    startRow: 10,
    columns: [
      {
        key: "category",
        header: "Rubro",
        kind: "list",
        width: 18,
        list: { source: lists.source("cat") },
      },
      { key: "supplier", header: "Proveedor", kind: "text", width: 22 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      { key: "planned", header: "Presupuestado", kind: "currency", width: 13, total: "sum" },
      { key: "actual", header: "Costo real", kind: "currency", width: 13, total: "sum" },
      { key: "paid", header: "Pagado", kind: "currency", width: 12, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("category")}="","",N(${r.c("actual")})-N(${r.c("paid")}))`,
      },
      { key: "due", header: "Pagar antes de", kind: "date", width: 12 },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 14,
        list: ["Por contratar", "Contratado", "Pagado"],
      },
      {
        key: "diff",
        header: "Diferencia",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        allowNegative: true,
        formula: (r) =>
          `IF(OR(${r.c("category")}="",${r.c("actual")}=""),"",N(${r.c("planned")})-${r.c("actual")})`,
      },
    ],
    rows: config.items,
    theme,
    ctx,
    autoFilter: true,
    totals: { label: "Totales" },
    example: ex
      ? [
          {
            category: cat(0),
            supplier: "Salón Las Palmas",
            planned: 35000,
            actual: 38000,
            paid: 15000,
            due: fromToday(30),
            status: "Contratado",
          },
          {
            category: cat(1),
            supplier: "Banquetes Doña Marta",
            planned: 45000,
            actual: 42000,
            paid: 10000,
            due: fromToday(45),
            status: "Contratado",
          },
          {
            category: cat(5),
            supplier: "Foto Estudio Luz",
            planned: 15000,
            actual: 15000,
            paid: 15000,
            status: "Pagado",
          },
        ]
      : undefined,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 5,
    valueCol: 7,
    labelSpan: 2,
    fields: [
      {
        key: "actual",
        label: "Costo real",
        kind: "calc",
        resultKind: "currency",
        formula: () => items.total("actual"),
      },
      {
        key: "pending",
        label: "Falta por pagar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => items.total("balance"),
      },
      {
        key: "left",
        label: "Disponible del presupuesto",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${f.cell("budget")}-${items.total("actual")}`,
      },
      {
        key: "perGuest",
        label: "Costo por persona confirmada",
        kind: "calc",
        resultKind: "currency",
        formula: () =>
          `IFERROR(ROUND(${items.total("actual")}/SUMIFS(${G("people")},${G("confirmed")},"Sí"),2),"")`,
      },
    ],
    theme,
    ctx,
  });
  const R = (k: string) => items.sheetRange(k);
  addCategorySummary(ws, {
    startRow: items.totalRow! + 3,
    startCol: 1,
    labelHeader: "Rubro",
    sourceCells: cellsOfRange(lists.source("cat")),
    values: [
      {
        header: "Presupuestado",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("planned")},${R("category")},${k.labelCell}))`,
      },
      {
        header: "Costo real",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("actual")},${R("category")},${k.labelCell}))`,
      },
      {
        header: "Pagado",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${R("paid")},${R("category")},${k.labelCell}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 22,
  });
  const d = items.letter("due");
  const b = items.letter("balance");
  highlightWhen(
    ws,
    `A${items.firstRow}:${items.letter("diff")}${items.lastRow}`,
    `AND(N($${b}${items.firstRow})>0,$${d}${items.firstRow}<>"",$${d}${items.firstRow}-TODAY()<=7)`,
    { fill: theme.warningSoft },
    1,
  );
  await protectSheet(ws);
  await protectSheet(gw);

  addInstructionsSheet(wb, {
    title: "Presupuesto de boda o evento",
    description: "Organiza el dinero y los invitados de tu evento sin sorpresas.",
    steps: [
      "Escribe tu presupuesto total arriba a la izquierda.",
      "Agrega cada proveedor o gasto con su rubro, lo presupuestado, el costo real, lo pagado y la fecha límite.",
      "En Invitados escribe cada familia o grupo con el número de personas y si confirmó.",
      "Verás lo que falta por pagar, cuánto queda del presupuesto y el costo por persona confirmada.",
    ],
    tips: ["Los pagos con saldo que vencen en los próximos 7 días se marcan en amarillo."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
