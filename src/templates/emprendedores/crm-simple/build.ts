import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { lighten, makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId, fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { CrmConfig } from "./form";

const ALERTS = ["Acción atrasada", "Sin contacto", "Hoy"];

const STAGES: [string, number][] = [
  ["Nuevo", 0.1],
  ["Contactado", 0.2],
  ["Cotizado", 0.4],
  ["Negociación", 0.6],
  ["Ganado", 1],
  ["Perdido", 0],
];

export const build: TemplateBuild<CrmConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith("CRM", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const cl = addSheet(wb, "Clientes", {
    freezeRows: 6,
    freezeCols: 3,
    tabColor: theme.primary,
    landscape: true,
  });
  const fu = addSheet(wb, "Seguimiento", { freezeRows: 4, tabColor: theme.primary });
  const fn = addSheet(wb, "Embudo", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "sellers", title: "Vendedores", values: config.sellers, spare: 10 },
    { key: "sources", title: "Origen", values: config.sources, spare: 8 },
  ]);
  const ex = config.example;
  const seller = (i: number) => config.sellers[i % config.sellers.length]!;
  const src = (i: number) => config.sources[i % config.sources.length]!;
  const clLast = 6 + config.leads;
  const clNames = `'Clientes'!$C$7:$C$${clLast}`;

  // Etapas con su probabilidad (editable)
  addSheetHeader(fn, {
    title: titleWith("Embudo de ventas", config.businessName),
    subtitle: "Ajusta la probabilidad de cierre de cada etapa.",
    theme,
    width: 6,
  });
  const stg = addTable(fn, {
    startRow: 4,
    columns: [
      { key: "stage", header: "Etapa", kind: "text", width: 18 },
      { key: "prob", header: "Probabilidad", kind: "percent", width: 12 },
    ],
    rows: STAGES.length,
    theme,
    ctx,
    example: STAGES.map(([stage, prob]) => ({ stage, prob })),
  });
  const ST = (k: string) => stg.sheetRange(k);

  // Seguimiento
  addSheetHeader(fu, {
    title: "Seguimiento",
    subtitle:
      "Anota cada contacto en orden de fecha; el último contacto se actualiza solo en Clientes.",
    theme,
    width: 6,
  });
  const ft = addTable(fu, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "client", header: "Cliente", kind: "list", width: 26, list: { source: clNames } },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 12,
        list: ["Llamada", "WhatsApp", "Visita", "Correo", "Reunión", "Mensaje en redes"],
      },
      { key: "notes", header: "Qué se habló", kind: "text", width: 36 },
      {
        key: "n",
        header: "Contacto n.º",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        formula: (r) => `IF(${r.c("client")}="","",COUNTIF(${r.upTo("client")},${r.c("client")}))`,
      },
      {
        key: "key",
        header: "Clave",
        kind: "formula",
        width: 8,
        formula: (r) => `IF(${r.c("client")}="","",${r.c("client")}&"|"&${r.c("n")})`,
        note: "Columna auxiliar para encontrar el último contacto.",
      },
    ],
    rows: 5000,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(-20),
            client: "Ana Gabriela Matute",
            type: "WhatsApp",
            notes: "Pidió precios del plan familiar",
          },
          {
            date: fromToday(-12),
            client: "Ana Gabriela Matute",
            type: "Reunión",
            notes: "Se le presentó la cotización",
          },
          {
            date: fromToday(-15),
            client: "Transportes Rápidos S. de R.L.",
            type: "Llamada",
            notes: "Interesados en 5 pólizas de vehículos",
          },
          {
            date: fromToday(-3),
            client: "Transportes Rápidos S. de R.L.",
            type: "Visita",
            notes: "Negociando descuento por volumen",
          },
          {
            date: fromToday(-30),
            client: "Pedro Antonio Lagos",
            type: "Llamada",
            notes: "Firmó y pagó",
          },
        ]
      : undefined,
  });
  const F = (k: string) => ft.sheetRange(k);

  // Clientes
  addSheetHeader(cl, {
    title,
    subtitle: "Una fila por cliente potencial u oportunidad de venta.",
    theme,
    width: 20,
  });
  const top = addFields(cl, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      {
        key: "stale",
        label: "Avisar sin contacto después de (días)",
        kind: "integer",
        value: config.staleDays,
      },
    ],
    theme,
    ctx,
  });
  const STALE = top.ref("stale");
  const closed = (r: { c: (k: string) => string }) =>
    `OR(${r.c("stage")}="Ganado",${r.c("stage")}="Perdido")`;
  const ctb = addTable(cl, {
    startRow: 6,
    columns: [
      {
        key: "id",
        header: "N.º",
        kind: "formula",
        width: 7,
        align: "center",
        formula: (r) => correlativeId("C-", r.c("name"), r.index),
      },
      { key: "date", header: "Fecha de ingreso", kind: "date", width: 12 },
      { key: "name", header: "Nombre", kind: "text", width: 26 },
      { key: "company", header: "Empresa", kind: "text", width: 18 },
      { key: "phone", header: "Teléfono", kind: "text", width: 12 },
      {
        key: "source",
        header: "Origen",
        kind: "list",
        width: 14,
        list: { source: lists.source("sources") },
      },
      { key: "interest", header: "Interés", kind: "text", width: 20 },
      { key: "value", header: "Valor estimado", kind: "currency", width: 13, total: "sum" },
      {
        key: "stage",
        header: "Etapa",
        kind: "list",
        width: 13,
        list: { source: ST("stage") },
        align: "center",
      },
      {
        key: "prob",
        header: "Probabilidad",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(${r.c("stage")}="","",IFERROR(INDEX(${ST("prob")},MATCH(${r.c("stage")},${ST("stage")},0)),0))`,
      },
      {
        key: "weighted",
        header: "Valor ponderado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("prob")}="","",N(${r.c("value")})*${r.c("prob")})`,
      },
      {
        key: "owner",
        header: "Vendedor",
        kind: "list",
        width: 13,
        list: { source: lists.source("sellers") },
      },
      {
        key: "last",
        header: "Último contacto",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(COUNTIF(${F("client")},${r.c("name")})=0,"",IFERROR(INDEX(${F("date")},MATCH(${r.c("name")}&"|"&COUNTIF(${F("client")},${r.c("name")}),${F("key")},0)),"")))`,
      },
      {
        key: "contacts",
        header: "Contactos",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        formula: (r) => `IF(${r.c("name")}="","",COUNTIF(${F("client")},${r.c("name")}))`,
      },
      { key: "next", header: "Próxima acción", kind: "text", width: 22 },
      { key: "nextDate", header: "Fecha de la próxima acción", kind: "date", width: 12 },
      {
        key: "alert",
        header: "Alerta",
        kind: "formula",
        width: 13,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("name")}="",${closed(r)}),"",IF(AND(${r.c("nextDate")}<>"",${r.c("nextDate")}<TODAY()),"Acción atrasada",IF(AND(${r.c("last")}<>"",TODAY()-N(${r.c("last")})>${STALE}),"Sin contacto",IF(AND(${r.c("nextDate")}<>"",${r.c("nextDate")}=TODAY()),"Hoy",""))))`,
      },
      { key: "closedOn", header: "Fecha de cierre", kind: "date", width: 12 },
      { key: "lostReason", header: "Motivo si se perdió", kind: "text", width: 20 },
    ],
    rows: config.leads,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 30,
    example: ex
      ? [
          {
            date: fromToday(-21),
            name: "Ana Gabriela Matute",
            phone: "9876-0001",
            source: src(2),
            interest: "Seguro médico familiar",
            value: 24000,
            stage: "Cotizado",
            owner: seller(0),
            next: "Llamar para resolver dudas",
            nextDate: fromToday(-1),
          },
          {
            date: fromToday(-16),
            name: "Transportes Rápidos S. de R.L.",
            company: "Transportes Rápidos",
            phone: "2550-0000",
            source: src(3),
            interest: "Seguro de flota",
            value: 90000,
            stage: "Negociación",
            owner: seller(1),
            next: "Enviar propuesta final",
            nextDate: fromToday(2),
          },
          {
            date: fromToday(-35),
            name: "Pedro Antonio Lagos",
            phone: "3300-1122",
            source: src(0),
            interest: "Seguro de vida",
            value: 12000,
            stage: "Ganado",
            owner: seller(0),
            closedOn: fromToday(-30),
          },
          {
            date: fromToday(-5),
            name: "María Fernanda Cálix",
            phone: "9988-7766",
            source: src(1),
            interest: "Seguro de vehículo",
            value: 8000,
            stage: "Nuevo",
            owner: seller(0),
          },
        ]
      : undefined,
  });
  if (ctb.letter("name") !== "C" || ctb.lastRow !== clLast)
    throw new Error("Rango de clientes inesperado");
  const C = (k: string) => ctb.sheetRange(k);
  const al = ctb.letter("alert");
  const rowRange = `A${ctb.firstRow}:${ctb.letter("lostReason")}${ctb.lastRow}`;
  highlightWhen(
    cl,
    rowRange,
    `$${al}${ctb.firstRow}="Acción atrasada"`,
    { fill: theme.dangerSoft },
    1,
  );
  highlightWhen(
    cl,
    rowRange,
    `OR($${al}${ctb.firstRow}="Sin contacto",$${al}${ctb.firstRow}="Hoy")`,
    { fill: lighten(theme.highlight, 0.6) },
    2,
  );
  const sg = ctb.letter("stage");
  highlightWhen(
    cl,
    `${sg}${ctb.firstRow}:${sg}${ctb.lastRow}`,
    `${sg}${ctb.firstRow}="Ganado"`,
    { fill: theme.okSoft, bold: true },
    3,
  );

  // Embudo
  const bs = addCategorySummary(fn, {
    startRow: stg.lastRow + 3,
    startCol: 1,
    labelHeader: "Etapa de venta",
    sourceCells: cellsOfRange(ST("stage")),
    values: [
      {
        header: "Clientes",
        kind: "integer",
        formula: (k) => `IF(${k.labelCell}="","",COUNTIFS(${C("stage")},${k.labelCell}))`,
      },
      {
        header: "Valor",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("value")},${C("stage")},${k.labelCell}))`,
      },
      {
        header: "Valor ponderado",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("weighted")},${C("stage")},${k.labelCell}))`,
      },
    ],
    theme,
    ctx,
  });
  const bsrc = addCategorySummary(fn, {
    startRow: bs.totalRow + 3,
    startCol: 1,
    labelHeader: "Origen",
    sourceCells: cellsOfRange(lists.source("sources")),
    values: [
      {
        header: "Clientes",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${C("source")},${k.labelCell},${C("name")},"<>"))`,
      },
      {
        header: "Ganados",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${C("source")},${k.labelCell},${C("stage")},"Ganado"))`,
      },
      {
        header: "Conversión",
        kind: "percent",
        formula: (k) =>
          `IF(${k.labelCell}="","",IF(COUNTIFS(${C("source")},${k.labelCell},${C("name")},"<>")=0,"",COUNTIFS(${C("source")},${k.labelCell},${C("stage")},"Ganado")/COUNTIFS(${C("source")},${k.labelCell},${C("name")},"<>")))`,
        total: false,
      },
      {
        header: "Vendido",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("value")},${C("source")},${k.labelCell},${C("stage")},"Ganado"))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 20,
  });
  const bo = addCategorySummary(fn, {
    startRow: bsrc.totalRow + 3,
    startCol: 1,
    labelHeader: "Vendedor",
    sourceCells: cellsOfRange(lists.source("sellers")),
    values: [
      {
        header: "En proceso",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${C("owner")},${k.labelCell},${C("stage")},"<>Ganado",${C("stage")},"<>Perdido",${C("name")},"<>"))`,
      },
      {
        header: "Ponderado en proceso",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("weighted")},${C("owner")},${k.labelCell},${C("stage")},"<>Ganado",${C("stage")},"<>Perdido"))`,
      },
      {
        header: "Vendido",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${C("value")},${C("owner")},${k.labelCell},${C("stage")},"Ganado"))`,
      },
      {
        header: "Alertas",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",${ALERTS.map((a) => `COUNTIFS(${C("owner")},${k.labelCell},${C("alert")},"${a}")`).join("+")})`,
      },
    ],
    theme,
    ctx,
  });
  const yf = addFields(fn, {
    startRow: bo.totalRow + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      {
        key: "pipeline",
        label: "Valor ponderado en proceso",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () =>
          `SUMIFS(${C("weighted")},${C("stage")},"<>Ganado",${C("stage")},"<>Perdido")`,
      },
      {
        key: "alerts",
        label: "Clientes con alerta",
        kind: "calc",
        resultKind: "integer",
        formula: () => ALERTS.map((a) => `COUNTIF(${C("alert")},"${a}")`).join("+"),
      },
    ],
    theme,
    ctx,
  });
  const inMonth = (col: string, s?: string, e?: string) => `${col},">="&${s},${col},"<="&${e}`;
  addMonthlySummary(fn, {
    startRow: yf.nextRow + 1,
    startCol: 1,
    yearCell: yf.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Clientes nuevos",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${inMonth(C("date"), k.monthStart, k.monthEnd)},${C("name")},"<>")`,
      },
      {
        header: "Ventas cerradas",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${inMonth(C("closedOn"), k.monthStart, k.monthEnd)},${C("stage")},"Ganado")`,
      },
      {
        header: "Valor vendido",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${C("value")},${inMonth(C("closedOn"), k.monthStart, k.monthEnd)},${C("stage")},"Ganado")`,
      },
    ],
  });

  for (const w of [cl, fu, fn]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "CRM simple",
    description: "Que ningún cliente potencial se te olvide y sepas qué ventas vienen.",
    steps: [
      "En Clientes registra a cada interesado con su origen, interés, valor estimado y vendedor.",
      "Cambia la etapa a medida que avanza: Nuevo, Contactado, Cotizado, Negociación, Ganado o Perdido.",
      "En Seguimiento anota cada llamada, mensaje o visita en orden de fecha: el último contacto aparece solo.",
      "Escribe la próxima acción y su fecha: los atrasados se pintan en rojo y los que llevan días sin contacto en amarillo.",
      "Embudo muestra el valor por etapa, la conversión por origen y lo vendido por vendedor y por mes.",
    ],
    tips: [
      "Cuando ganes una venta escribe la fecha de cierre para que cuente en el mes correcto.",
      "Filtra Clientes por Alerta para armar tu lista de llamadas del día.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
