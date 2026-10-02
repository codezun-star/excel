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
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { MedicamentosConfig } from "./form";

const TIME_FMT = "h:mm AM/PM";
const at = (h: number, m = 0) => (h * 60 + m) / 1440;
/** Máximo de horarios que se muestran por medicamento. */
const MAX_DOSES = 6;

export const build: TemplateBuild<MedicamentosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith("Medicamentos", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const meds = addSheet(wb, "Medicamentos", {
    freezeRows: 6,
    freezeCols: 1,
    tabColor: theme.primary,
    landscape: true,
  });
  const log = addSheet(wb, "Tomas", { freezeRows: 4, tabColor: theme.primary });
  const buy = addSheet(wb, "Compras", { freezeRows: 4, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "people", title: "Personas", values: config.people, spare: 10 },
    {
      key: "forms",
      title: "Presentación",
      values: [
        "Tableta",
        "Cápsula",
        "Jarabe (ml)",
        "Gotas",
        "Inyección",
        "Crema",
        "Inhalador",
        "Sobre",
      ],
    },
  ]);
  const ex = config.example;
  const person = (i: number) => config.people[i % config.people.length]!;

  addSheetHeader(meds, {
    title: titleWith("Control de medicamentos", config.businessName),
    subtitle:
      "Dosis, horarios, existencias y vencimientos. Sigue siempre la indicación de tu médico.",
    theme,
    width: 17,
  });
  const top = addFields(meds, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "expiry",
        label: "Avisar vencimiento (días antes)",
        kind: "integer",
        value: config.expiryDays,
      },
      {
        key: "reorder",
        label: "Avisar compra (días que quedan)",
        kind: "integer",
        value: config.reorderDays,
      },
    ],
    theme,
    ctx,
  });
  const EXP = top.ref("expiry");
  const REO = top.ref("reorder");
  const mt = addTable(meds, {
    startRow: 6,
    columns: [
      { key: "name", header: "Medicamento", kind: "text", width: 22 },
      { key: "strength", header: "Concentración", kind: "text", width: 11 },
      {
        key: "form",
        header: "Presentación",
        kind: "list",
        width: 12,
        list: { source: lists.source("forms") },
      },
      {
        key: "person",
        header: "Para",
        kind: "list",
        width: 12,
        list: { source: lists.source("people") },
      },
      { key: "dose", header: "Unidades por toma", kind: "number", width: 9 },
      { key: "every", header: "Cada (horas)", kind: "integer", width: 8 },
      {
        key: "first",
        header: "Primera toma",
        kind: "number",
        numFmt: TIME_FMT,
        width: 10,
        align: "center",
      },
      {
        key: "perDay",
        header: "Tomas al día",
        kind: "formula",
        resultKind: "integer",
        width: 8,
        formula: (r) => `IF(OR(${r.c("name")}="",N(${r.c("every")})=0),"",INT(24/${r.c("every")}))`,
      },
      {
        key: "times",
        header: "Horarios",
        kind: "formula",
        width: 30,
        wrap: true,
        formula: (r) => {
          const t = (k: number) => `TEXT(MOD(${r.c("first")}+${k}*${r.c("every")}/24,1),"h:mm")`;
          const rest = Array.from(
            { length: MAX_DOSES - 1 },
            (_, i) => `IF(${r.c("perDay")}>=${i + 2},"  ·  "&${t(i + 1)},"")`,
          ).join("&");
          return `IF(OR(${r.c("perDay")}="",${r.c("first")}=""),"",${t(0)}&${rest})`;
        },
      },
      {
        key: "daily",
        header: "Unidades al día",
        kind: "formula",
        resultKind: "number",
        width: 9,
        formula: (r) => `IF(${r.c("perDay")}="","",N(${r.c("dose")})*${r.c("perDay")})`,
      },
      { key: "stock", header: "Existencia (unidades)", kind: "number", width: 10 },
      {
        key: "days",
        header: "Días que alcanza",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        formula: (r) =>
          `IF(OR(${r.c("daily")}="",N(${r.c("daily")})=0),"",INT(N(${r.c("stock")})/${r.c("daily")}))`,
      },
      {
        key: "runsOut",
        header: "Se termina el",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) => `IF(${r.c("days")}="","",TODAY()+${r.c("days")})`,
      },
      { key: "expires", header: "Vence", kind: "date", width: 12 },
      {
        key: "toExpiry",
        header: "Días para vencer",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        allowNegative: true,
        formula: (r) => `IF(${r.c("expires")}="","",${r.c("expires")}-TODAY())`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("name")}="","",IF(AND(${r.c("toExpiry")}<>"",N(${r.c("toExpiry")})<0),"Vencido",IF(AND(${r.c("toExpiry")}<>"",N(${r.c("toExpiry")})<=${EXP}),"Por vencer",IF(AND(${r.c("days")}<>"",N(${r.c("days")})<=${REO}),"Comprar","Bien"))))`,
      },
      { key: "notes", header: "Indicaciones", kind: "text", width: 26 },
    ],
    rows: config.medicines,
    theme,
    ctx,
    autoFilter: true,
    headerHeight: 32,
    example: ex
      ? [
          {
            name: "Losartán",
            strength: "50 mg",
            form: "Tableta",
            person: person(0),
            dose: 1,
            every: 24,
            first: at(7),
            stock: 25,
            expires: fromToday(300),
            notes: "En ayunas",
          },
          {
            name: "Metformina",
            strength: "850 mg",
            form: "Tableta",
            person: person(0),
            dose: 1,
            every: 12,
            first: at(7),
            stock: 8,
            expires: fromToday(200),
            notes: "Con las comidas",
          },
          {
            name: "Acetaminofén",
            strength: "500 mg",
            form: "Tableta",
            person: person(1),
            dose: 2,
            every: 8,
            first: at(6),
            stock: 30,
            expires: fromToday(15),
          },
          {
            name: "Salbutamol",
            strength: "100 mcg",
            form: "Inhalador",
            person: person(1),
            stock: 1,
            expires: fromToday(-10),
            notes: "Solo si hay falta de aire",
          },
        ]
      : undefined,
  });
  const M = (k: string) => mt.sheetRange(k);
  const s = mt.letter("status");
  const row = `A${mt.firstRow}:${mt.letter("notes")}${mt.lastRow}`;
  highlightWhen(meds, row, `$${s}${mt.firstRow}="Vencido"`, { fill: theme.dangerSoft }, 1);
  highlightWhen(
    meds,
    row,
    `$${s}${mt.firstRow}="Por vencer"`,
    { fill: lighten(theme.highlight, 0.6) },
    2,
  );
  highlightWhen(
    meds,
    `${s}${mt.firstRow}:${s}${mt.lastRow}`,
    `${s}${mt.firstRow}="Comprar"`,
    { fill: "#DCEBF7", bold: true },
    3,
  );

  addSheetHeader(log, {
    title: "Registro de tomas",
    subtitle: "Marca cada toma para no repetir ni olvidar dosis.",
    theme,
    width: 6,
  });
  addTable(log, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "time", header: "Hora", kind: "number", numFmt: TIME_FMT, width: 10, align: "center" },
      { key: "med", header: "Medicamento", kind: "list", width: 22, list: { source: M("name") } },
      {
        key: "person",
        header: "Para",
        kind: "formula",
        width: 12,
        formula: (r) =>
          `IF(${r.c("med")}="","",IFERROR(INDEX(${M("person")},MATCH(${r.c("med")},${M("name")},0)),""))`,
      },
      {
        key: "taken",
        header: "¿Tomó?",
        kind: "list",
        width: 9,
        list: ["Sí", "No"],
        align: "center",
      },
      { key: "notes", header: "Notas (reacciones, síntomas)", kind: "text", width: 32 },
    ],
    rows: 3000,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          { date: fromToday(0), time: at(7), med: "Losartán", taken: "Sí" },
          { date: fromToday(0), time: at(7), med: "Metformina", taken: "Sí" },
          {
            date: fromToday(0),
            time: at(19),
            med: "Metformina",
            taken: "No",
            notes: "Se le olvidó; avisar al médico si se repite",
          },
        ]
      : undefined,
  });

  addSheetHeader(buy, {
    title: "Compras de medicamentos",
    subtitle: "Al comprar, suma también la existencia en Medicamentos.",
    theme,
    width: 6,
  });
  const bt = addTable(buy, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "med", header: "Medicamento", kind: "list", width: 22, list: { source: M("name") } },
      { key: "qty", header: "Unidades", kind: "number", width: 10 },
      { key: "total", header: "Total pagado", kind: "currency", width: 13, total: "sum" },
      {
        key: "unit",
        header: "Precio por unidad",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        formula: (r) =>
          `IF(OR(${r.c("med")}="",N(${r.c("qty")})=0),"",${r.c("total")}/${r.c("qty")})`,
      },
      { key: "store", header: "Farmacia", kind: "text", width: 20 },
    ],
    rows: 1000,
    theme,
    ctx,
    totals: { label: "Total" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(-20),
            med: "Losartán",
            qty: 30,
            total: 450,
            store: "Farmacia del barrio",
          },
        ]
      : undefined,
  });
  const B = (k: string) => bt.sheetRange(k);

  addSheetHeader(sum, {
    title: titleWith(`Resumen ${y}`, config.businessName),
    subtitle: "Alertas y gasto en medicamentos.",
    theme,
    width: 4,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      {
        key: "expired",
        label: "Medicamentos vencidos",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${M("status")},"Vencido")`,
      },
      {
        key: "soon",
        label: "Por vencer",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${M("status")},"Por vencer")`,
      },
      {
        key: "buy",
        label: "Por comprar",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: () => `COUNTIF(${M("status")},"Comprar")`,
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(1).width = 26;
  const monthly = addMonthlySummary(sum, {
    startRow: f.nextRow + 1,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Gasto en compras",
        kind: "currency",
        formula: (k) =>
          `SUMIFS(${B("total")},${B("date")},">="&${k.monthStart},${B("date")},"<="&${k.monthEnd})`,
      },
    ],
  });
  addCategorySummary(sum, {
    startRow: monthly.totalRow + 3,
    startCol: 1,
    labelHeader: "Persona",
    sourceCells: cellsOfRange(lists.source("people")),
    values: [
      {
        header: "Medicamentos",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${M("person")},${k.labelCell},${M("name")},"<>"))`,
      },
      {
        header: "Con alerta",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${M("person")},${k.labelCell},${M("status")},"<>Bien",${M("name")},"<>"))`,
      },
    ],
    theme,
    ctx,
  });

  for (const w of [meds, log, buy, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Medicamentos y vencimientos",
    description: "Que nadie se quede sin su medicina ni tome un medicamento vencido.",
    steps: [
      "En Medicamentos escribe cada medicamento con su concentración, para quién es, unidades por toma, cada cuántas horas y la hora de la primera toma.",
      "Los horarios del día, los días que alcanza la existencia y la fecha en que se termina se calculan solos.",
      "Escribe la fecha de vencimiento de la caja: los vencidos se pintan en rojo y los por vencer en amarillo.",
      "Registra las tomas y las compras; el Resumen muestra las alertas y el gasto por mes.",
    ],
    tips: [
      "Esta plantilla ayuda a organizarte; no cambies dosis ni horarios sin indicación médica.",
      "Entrega los medicamentos vencidos en la farmacia o centro de salud; no los tires a la basura.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
