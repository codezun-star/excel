import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId, fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { CitasConfig } from "./form";

const TIME_FMT = "h:mm AM/PM";
const at = (h: number, m = 0) => (h * 60 + m) / 1440;

export const build: TemplateBuild<CitasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith("Citas y pacientes", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const day = addSheet(wb, "Agenda del día", { tabColor: theme.primary, landscape: true });
  const ap = addSheet(wb, "Citas", { freezeRows: 4, tabColor: theme.primary, landscape: true });
  const pt = addSheet(wb, "Pacientes", { freezeRows: 4, tabColor: theme.primary, landscape: true });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "pros", title: "Profesionales", values: config.professionals, spare: 10 },
    {
      key: "reasons",
      title: "Tipos de cita",
      values: ["Primera vez", "Control", "Procedimiento", "Emergencia", "Resultados"],
    },
  ]);
  const ex = config.example;
  const pro = (i: number) => config.professionals[i % config.professionals.length]!;
  const price = config.price;

  // Pacientes
  addSheetHeader(pt, {
    title: "Pacientes",
    subtitle: "Datos de contacto; la edad se calcula con la fecha de nacimiento.",
    theme,
    width: 10,
  });
  const pTable = addTable(pt, {
    startRow: 4,
    columns: [
      {
        key: "id",
        header: "Código",
        kind: "formula",
        width: 10,
        align: "center",
        formula: (r) => correlativeId("PAC-", r.c("name"), r.index),
      },
      { key: "name", header: "Nombre completo", kind: "text", width: 28 },
      { key: "dni", header: "Identidad", kind: "text", width: 16 },
      { key: "birth", header: "Fecha de nacimiento", kind: "date", width: 13 },
      {
        key: "age",
        header: "Edad",
        kind: "formula",
        resultKind: "integer",
        width: 7,
        align: "center",
        formula: (r) =>
          `IF(${r.c("birth")}="","",YEAR(TODAY())-YEAR(${r.c("birth")})-IF(OR(MONTH(TODAY())<MONTH(${r.c("birth")}),AND(MONTH(TODAY())=MONTH(${r.c("birth")}),DAY(TODAY())<DAY(${r.c("birth")}))),1,0))`,
      },
      { key: "sex", header: "Sexo", kind: "list", width: 7, list: ["F", "M"], align: "center" },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      {
        key: "insurance",
        header: "Pago",
        kind: "list",
        width: 14,
        list: ["Particular", "Seguro médico", "Convenio"],
      },
      {
        key: "visits",
        header: "Citas atendidas",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        formula: (r) =>
          `IF(${r.c("name")}="","",COUNTIFS('Citas'!$C$5:$C$${4 + config.appointments},${r.c("name")},'Citas'!$H$5:$H$${4 + config.appointments},"Atendida"))`,
      },
      { key: "notes", header: "Notas", kind: "text", width: 26 },
    ],
    rows: config.patients,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            name: "María Elena Rodríguez",
            dni: "0801-1985-04512",
            birth: "1985-03-14",
            sex: "F",
            phone: "9988-1234",
            insurance: "Particular",
          },
          {
            name: "José Luis Andino",
            dni: "0501-1972-01234",
            birth: "1972-11-02",
            sex: "M",
            phone: "3344-5566",
            insurance: "Seguro médico",
          },
          {
            name: "Camila Fernanda Ortiz",
            birth: "2016-06-20",
            sex: "F",
            phone: "9765-4321",
            insurance: "Particular",
            notes: "Encargada: su mamá",
          },
        ]
      : undefined,
  });
  const P = (k: string) => pTable.sheetRange(k);

  // Agenda del día (la fecha elegida se usa en la columna auxiliar de Citas)
  addSheetHeader(day, {
    title: titleWith("Agenda del día", config.businessName),
    subtitle: "Cambia la fecha para ver las citas de ese día (las canceladas no aparecen).",
    theme,
    width: 7,
  });
  const df = addFields(day, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "date", label: "Fecha", kind: "date" }],
    theme,
    ctx,
  });
  const DATE = df.ref("date");
  day.getCell(df.cell("date").replace(/\$/g, "")).value = { formula: "TODAY()" };

  // Citas
  addSheetHeader(ap, {
    title: "Citas",
    subtitle: "Una fila por cita; el saldo y la agenda del día se calculan solos.",
    theme,
    width: 13,
  });
  const aTable = addTable(ap, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "time", header: "Hora", kind: "number", width: 10, numFmt: TIME_FMT, align: "center" },
      { key: "patient", header: "Paciente", kind: "list", width: 26, list: { source: P("name") } },
      {
        key: "phone",
        header: "Teléfono",
        kind: "formula",
        width: 12,
        formula: (r) =>
          `IF(${r.c("patient")}="","",IFERROR(INDEX(${P("phone")},MATCH(${r.c("patient")},${P("name")},0)),""))`,
      },
      { key: "reason", header: "Motivo", kind: "text", width: 24 },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 13,
        list: { source: lists.source("reasons") },
      },
      {
        key: "pro",
        header: "Profesional",
        kind: "list",
        width: 16,
        list: { source: lists.source("pros") },
      },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 12,
        list: ["Programada", "Confirmada", "Atendida", "No asistió", "Cancelada"],
        align: "center",
      },
      { key: "price", header: "Precio", kind: "currency", width: 11, total: "sum" },
      { key: "paid", header: "Pagado", kind: "currency", width: 11, total: "sum" },
      {
        key: "method",
        header: "Forma de pago",
        kind: "list",
        width: 13,
        list: ["Efectivo", "Tarjeta", "Transferencia", "Seguro"],
      },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        total: "sum",
        formula: (r) => `IF(${r.c("status")}<>"Atendida","",MAX(0,${r.c("price")}-${r.c("paid")}))`,
      },
      {
        key: "order",
        header: "Orden en la agenda",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("date")}="",${r.c("date")}<>${DATE},${r.c("status")}="Cancelada"),"",COUNTIFS(${r.upTo("date")},${DATE},${r.upTo("status")},"<>Cancelada"))`,
        note: "Columna auxiliar para la hoja Agenda del día.",
      },
    ],
    rows: config.appointments,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(-7),
            time: at(9),
            patient: "María Elena Rodríguez",
            reason: "Limpieza dental",
            type: "Primera vez",
            pro: pro(0),
            status: "Atendida",
            price,
            paid: price,
            method: "Efectivo",
          },
          {
            date: fromToday(-7),
            time: at(10),
            patient: "José Luis Andino",
            reason: "Dolor de muela",
            type: "Emergencia",
            pro: pro(1),
            status: "Atendida",
            price: price * 2,
            paid: price,
            method: "Tarjeta",
          },
          {
            date: fromToday(-3),
            time: at(8, 30),
            patient: "Camila Fernanda Ortiz",
            reason: "Control",
            type: "Control",
            pro: pro(0),
            status: "No asistió",
            price,
          },
          {
            date: fromToday(0),
            time: at(9),
            patient: "José Luis Andino",
            reason: "Extracción",
            type: "Procedimiento",
            pro: pro(1),
            status: "Confirmada",
            price: price * 2,
          },
          {
            date: fromToday(0),
            time: at(11, 30),
            patient: "María Elena Rodríguez",
            reason: "Revisión",
            type: "Control",
            pro: pro(0),
            status: "Programada",
            price,
          },
          {
            date: fromToday(0),
            time: at(14),
            patient: "Camila Fernanda Ortiz",
            reason: "Reprogramada",
            type: "Control",
            pro: pro(0),
            status: "Cancelada",
            price,
          },
        ]
      : undefined,
  });
  if (aTable.letter("patient") !== "C" || aTable.letter("status") !== "H")
    throw new Error("Columnas de citas inesperadas");
  const A = (k: string) => aTable.sheetRange(k);
  const sc = aTable.letter("status");
  highlightWhen(
    ap,
    `${sc}${aTable.firstRow}:${sc}${aTable.lastRow}`,
    `${sc}${aTable.firstRow}="Atendida"`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    ap,
    `${sc}${aTable.firstRow}:${sc}${aTable.lastRow}`,
    `${sc}${aTable.firstRow}="No asistió"`,
    { fill: theme.dangerSoft, bold: true },
    2,
  );

  const pick = (key: string, k: string) =>
    `IFERROR(INDEX(${A(key)},MATCH(${k},${A("order")},0)),"")`;
  const dt = addTable(day, {
    startRow: 5,
    columns: [
      {
        key: "n",
        header: "N.º",
        kind: "formula",
        resultKind: "integer",
        width: 6,
        align: "center",
        formula: (r) => `IF(COUNTIF(${A("order")},${r.index + 1})=0,"",${r.index + 1})`,
      },
      {
        key: "time",
        header: "Hora",
        kind: "formula",
        resultKind: "number",
        numFmt: TIME_FMT,
        width: 11,
        align: "center",
        formula: (r) => `IF(${r.c("n")}="","",${pick("time", r.c("n"))})`,
      },
      {
        key: "patient",
        header: "Paciente",
        kind: "formula",
        width: 28,
        formula: (r) => `IF(${r.c("n")}="","",${pick("patient", r.c("n"))})`,
      },
      {
        key: "phone",
        header: "Teléfono",
        kind: "formula",
        width: 13,
        formula: (r) => `IF(${r.c("n")}="","",${pick("phone", r.c("n"))})`,
      },
      {
        key: "reason",
        header: "Motivo",
        kind: "formula",
        width: 26,
        formula: (r) => `IF(${r.c("n")}="","",${pick("reason", r.c("n"))})`,
      },
      {
        key: "pro",
        header: "Profesional",
        kind: "formula",
        width: 16,
        formula: (r) => `IF(${r.c("n")}="","",${pick("pro", r.c("n"))})`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) => `IF(${r.c("n")}="","",${pick("status", r.c("n"))})`,
      },
    ],
    rows: 40,
    theme,
    ctx,
  });
  addFields(day, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "count",
        label: "Citas del día",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: () => `COUNT(${dt.range("n")})`,
      },
    ],
    theme,
    ctx,
  });

  // Resumen
  addSheetHeader(sum, {
    title: titleWith(`Resumen ${y}`, config.businessName),
    subtitle: "Citas, inasistencias e ingresos por mes y por profesional.",
    theme,
    width: 6,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      {
        key: "patients",
        label: "Pacientes registrados",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIFS(${P("name")},"<>")`,
      },
    ],
    theme,
    ctx,
  });
  const inMonth = (s?: string, e?: string) => `${A("date")},">="&${s},${A("date")},"<="&${e}`;
  const monthly = addMonthlySummary(sum, {
    startRow: 6,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Citas",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${A("patient")},"<>",${A("status")},"<>Cancelada")`,
      },
      {
        header: "Atendidas",
        kind: "integer",
        formula: (k) => `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${A("status")},"Atendida")`,
      },
      {
        header: "No asistió",
        kind: "integer",
        formula: (k) =>
          `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${A("status")},"No asistió")`,
      },
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) => `SUMIFS(${A("paid")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
    ],
  });
  addCategorySummary(sum, {
    startRow: monthly.totalRow + 3,
    startCol: 1,
    labelHeader: "Profesional",
    sourceCells: cellsOfRange(lists.source("pros")),
    values: [
      {
        header: "Atendidas",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${A("pro")},${k.labelCell},${A("status")},"Atendida"))`,
      },
      {
        header: "Ingresos",
        kind: "currency",
        formula: (k) => `IF(${k.labelCell}="","",SUMIFS(${A("paid")},${A("pro")},${k.labelCell}))`,
      },
      {
        header: "Por cobrar",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${A("balance")},${A("pro")},${k.labelCell}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 22,
  });
  addFields(sum, {
    startRow: 3,
    labelCol: 4,
    valueCol: 5,
    fields: [
      {
        key: "noShow",
        label: "Inasistencia del año",
        kind: "calc",
        resultKind: "percent",
        formula: () =>
          `IF(${monthly.totalCell(0)}=0,0,${monthly.totalCell(2)}/${monthly.totalCell(0)})`,
      },
      {
        key: "pending",
        label: "Saldo por cobrar",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => aTable.sheetTotal("balance"),
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(4).width = 22;

  for (const w of [day, ap, pt, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Citas y pacientes",
    description: "Agenda, pacientes y cobros de tu consultorio en un solo archivo.",
    steps: [
      "En Pacientes registra a cada paciente; el código y la edad se calculan solos.",
      "En Citas anota fecha, hora, paciente, motivo y profesional; cambia el estado cuando confirme, asista o falte.",
      "Al atender escribe el precio y lo pagado: el saldo pendiente aparece solo.",
      "En Agenda del día cambia la fecha para ver e imprimir las citas de ese día.",
      "El Resumen muestra citas, inasistencias e ingresos por mes y por profesional.",
    ],
    tips: [
      "Escribe la hora como 9:30 o 2:00 p. m.",
      "Estos datos son personales: guarda el archivo en un lugar seguro y protégelo con contraseña.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
