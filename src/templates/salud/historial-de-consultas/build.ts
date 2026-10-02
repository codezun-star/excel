import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addMonthlySummary } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { correlativeId, fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { HistorialConfig } from "./form";

const LB_TO_KG = 0.45359237;

export const build: TemplateBuild<HistorialConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const lb = config.weightUnit === "lb";
  const title = titleWith("Historial de consultas", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const card = addSheet(wb, "Ficha del paciente", { tabColor: theme.primary, landscape: true });
  const vs = addSheet(wb, "Consultas", {
    freezeRows: 4,
    freezeCols: 2,
    tabColor: theme.primary,
    landscape: true,
  });
  const pt = addSheet(wb, "Pacientes", {
    freezeRows: 4,
    freezeCols: 2,
    tabColor: theme.primary,
    landscape: true,
  });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;

  addSheetHeader(pt, {
    title: "Pacientes",
    subtitle: "Datos generales y antecedentes importantes.",
    theme,
    width: 12,
  });
  const pTable = addTable(pt, {
    startRow: 4,
    columns: [
      {
        key: "id",
        header: "Expediente",
        kind: "formula",
        width: 11,
        align: "center",
        formula: (r) => correlativeId("EXP-", r.c("name"), r.index),
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
      {
        key: "blood",
        header: "Tipo de sangre",
        kind: "list",
        width: 9,
        list: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
        align: "center",
      },
      { key: "allergies", header: "Alergias", kind: "text", width: 22 },
      { key: "chronic", header: "Enfermedades crónicas", kind: "text", width: 24 },
      { key: "meds", header: "Medicamentos de uso continuo", kind: "text", width: 24 },
      { key: "phone", header: "Teléfono", kind: "text", width: 13 },
      { key: "emergency", header: "Contacto de emergencia", kind: "text", width: 24 },
    ],
    rows: config.patients,
    theme,
    ctx,
    autoFilter: true,
    headerHeight: 30,
    example: ex
      ? [
          {
            name: "Rosa Amelia Banegas",
            dni: "0801-1960-02233",
            birth: "1960-08-09",
            sex: "F",
            blood: "O+",
            allergies: "Penicilina",
            chronic: "Hipertensión",
            meds: "Losartán 50 mg",
            phone: "9911-0000",
            emergency: "Hija: 9922-1111",
          },
          {
            name: "Mario Alberto Funes",
            birth: "1990-01-25",
            sex: "M",
            blood: "A+",
            allergies: "Ninguna",
            phone: "3300-2200",
          },
        ]
      : undefined,
  });
  const P = (k: string) => pTable.sheetRange(k);
  const allergyCol = pTable.letter("allergies");
  highlightWhen(
    pt,
    `${allergyCol}${pTable.firstRow}:${allergyCol}${pTable.lastRow}`,
    `AND(${allergyCol}${pTable.firstRow}<>"",${allergyCol}${pTable.firstRow}<>"Ninguna")`,
    { color: theme.danger, bold: true },
    1,
  );

  // La ficha define al paciente elegido; Consultas lo usa en su columna auxiliar
  addSheetHeader(card, {
    title: titleWith("Ficha del paciente", config.businessName),
    subtitle: "Elige al paciente para ver sus datos y sus consultas (la más reciente primero).",
    theme,
    width: 10,
  });
  const cf = addFields(card, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 2,
    fields: [
      {
        key: "patient",
        label: "Paciente",
        kind: "list",
        list: { source: P("name") },
        value: ex ? "Rosa Amelia Banegas" : undefined,
      },
    ],
    theme,
    ctx,
  });
  const SEL = cf.ref("patient");

  const wUnit = lb ? "lb" : "kg";
  addSheetHeader(vs, {
    title: "Consultas",
    subtitle: "Una fila por consulta. El IMC se calcula con el peso y la talla.",
    theme,
    width: 16,
  });
  const vTable = addTable(vs, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "patient", header: "Paciente", kind: "list", width: 26, list: { source: P("name") } },
      { key: "reason", header: "Motivo de consulta", kind: "text", width: 24 },
      { key: "sys", header: "Presión sistólica", kind: "integer", width: 9 },
      { key: "dia", header: "Presión diastólica", kind: "integer", width: 9 },
      { key: "pulse", header: "Pulso (lpm)", kind: "integer", width: 8 },
      { key: "temp", header: "Temperatura (°C)", kind: "number", width: 9 },
      { key: "weight", header: `Peso (${wUnit})`, kind: "number", width: 9 },
      { key: "height", header: "Talla (cm)", kind: "number", width: 9 },
      {
        key: "bmi",
        header: "IMC",
        kind: "formula",
        resultKind: "number",
        width: 8,
        formula: (r) =>
          `IF(OR(N(${r.c("weight")})=0,N(${r.c("height")})=0),"",ROUND(${r.c("weight")}${lb ? `*${LB_TO_KG}` : ""}/(${r.c("height")}/100)^2,1))`,
      },
      { key: "dx", header: "Diagnóstico", kind: "text", width: 26 },
      { key: "tx", header: "Tratamiento e indicaciones", kind: "text", width: 30 },
      { key: "next", header: "Próximo control", kind: "date", width: 12 },
      {
        key: "control",
        header: "Estado del control",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("patient")}="",${r.c("next")}=""),"",IF(COUNTIFS(${r.col("patient")},${r.c("patient")},${r.col("date")},">"&${r.c("date")})>0,"Atendido",IF(${r.c("next")}<TODAY(),"Vencido","Programado")))`,
      },
      { key: "notes", header: "Notas", kind: "text", width: 22 },
      {
        key: "n",
        header: "Consulta n.º",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        formula: (r) =>
          `IF(${r.c("patient")}="","",COUNTIF(${r.upTo("patient")},${r.c("patient")}))`,
      },
      {
        key: "order",
        header: "Orden en la ficha",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        formula: (r) => `IF(OR(${r.c("patient")}="",${r.c("patient")}<>${SEL}),"",${r.c("n")})`,
        note: "Columna auxiliar para la Ficha del paciente.",
      },
    ],
    rows: config.visits,
    theme,
    ctx,
    autoFilter: true,
    headerHeight: 32,
    example: ex
      ? [
          {
            date: fromToday(-60),
            patient: "Rosa Amelia Banegas",
            reason: "Control de presión",
            sys: 150,
            dia: 95,
            pulse: 80,
            temp: 36.6,
            weight: lb ? 165 : 75,
            height: 158,
            dx: "Hipertensión arterial no controlada",
            tx: "Losartán 50 mg cada día, dieta baja en sal",
            next: fromToday(-30),
          },
          {
            date: fromToday(-30),
            patient: "Rosa Amelia Banegas",
            reason: "Control de presión",
            sys: 132,
            dia: 84,
            pulse: 76,
            temp: 36.5,
            weight: lb ? 162 : 73.5,
            height: 158,
            dx: "Hipertensión en control",
            tx: "Continuar tratamiento",
            next: fromToday(5),
          },
          {
            date: fromToday(-2),
            patient: "Mario Alberto Funes",
            reason: "Fiebre y dolor de garganta",
            sys: 118,
            dia: 76,
            pulse: 92,
            temp: 38.4,
            weight: lb ? 180 : 82,
            height: 175,
            dx: "Faringoamigdalitis",
            tx: "Acetaminofén 500 mg cada 8 horas por 3 días",
            next: fromToday(7),
          },
        ]
      : undefined,
  });
  const V = (k: string) => vTable.sheetRange(k);
  const ctl = vTable.letter("control");
  highlightWhen(
    vs,
    `${ctl}${vTable.firstRow}:${ctl}${vTable.lastRow}`,
    `${ctl}${vTable.firstRow}="Vencido"`,
    { fill: theme.dangerSoft, bold: true },
    1,
  );

  // Datos del paciente en la ficha
  const idx = `MATCH(${SEL},${P("name")},0)`;
  const pInfo = (key: string) => `IF(${SEL}="","",IFERROR(INDEX(${P(key)},${idx})&"",""))`;
  addFields(card, {
    startRow: 4,
    labelCol: 1,
    valueCol: 2,
    valueSpan: 2,
    fields: [
      {
        key: "id",
        label: "Expediente",
        kind: "calc",
        resultKind: "text",
        formula: () => pInfo("id"),
      },
      { key: "age", label: "Edad", kind: "calc", resultKind: "text", formula: () => pInfo("age") },
      {
        key: "blood",
        label: "Tipo de sangre",
        kind: "calc",
        resultKind: "text",
        formula: () => pInfo("blood"),
      },
      {
        key: "phone",
        label: "Teléfono",
        kind: "calc",
        resultKind: "text",
        formula: () => pInfo("phone"),
      },
    ],
    theme,
    ctx,
  });
  const cf2 = addFields(card, {
    startRow: 3,
    labelCol: 5,
    valueCol: 6,
    labelSpan: 1,
    valueSpan: 4,
    fields: [
      {
        key: "allergies",
        label: "Alergias",
        kind: "calc",
        resultKind: "text",
        emphasis: true,
        formula: () => pInfo("allergies"),
      },
      {
        key: "chronic",
        label: "Enfermedades crónicas",
        kind: "calc",
        resultKind: "text",
        formula: () => pInfo("chronic"),
      },
      {
        key: "meds",
        label: "Medicamentos de uso continuo",
        kind: "calc",
        resultKind: "text",
        formula: () => pInfo("meds"),
      },
      {
        key: "visits",
        label: "Consultas registradas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `IF(${SEL}="","",COUNTIF(${V("patient")},${SEL}))`,
      },
      {
        key: "next",
        label: "Próximo control",
        kind: "calc",
        resultKind: "date",
        formula: (c) =>
          `IF(OR(${SEL}="",N(${c("visits")})=0),"",INDEX(${V("next")},MATCH(${c("visits")},${V("order")},0)))`,
      },
    ],
    theme,
    ctx,
  });
  card.getColumn(5).width = 24;
  const TOTAL = cf2.cell("visits");
  const pick = (key: string, k: string) =>
    `IFERROR(INDEX(${V(key)},MATCH(${k},${V("order")},0)),"")`;
  addTable(card, {
    startRow: 10,
    columns: [
      {
        key: "k",
        header: "Consulta n.º",
        kind: "formula",
        resultKind: "integer",
        width: 9,
        align: "center",
        formula: (r) => `IF(OR(${TOTAL}="",${r.index + 1}>N(${TOTAL})),"",${TOTAL}-${r.index})`,
      },
      {
        key: "date",
        header: "Fecha",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) => `IF(${r.c("k")}="","",${pick("date", r.c("k"))})`,
      },
      {
        key: "reason",
        header: "Motivo",
        kind: "formula",
        width: 22,
        formula: (r) => `IF(${r.c("k")}="","",${pick("reason", r.c("k"))})`,
      },
      {
        key: "bp",
        header: "Presión",
        kind: "formula",
        width: 9,
        align: "center",
        formula: (r) =>
          `IF(${r.c("k")}="","",IF(${pick("sys", r.c("k"))}="","",${pick("sys", r.c("k"))}&"/"&${pick("dia", r.c("k"))}))`,
      },
      {
        key: "temp",
        header: "Temp.",
        kind: "formula",
        resultKind: "number",
        width: 7,
        formula: (r) => `IF(${r.c("k")}="","",${pick("temp", r.c("k"))})`,
      },
      {
        key: "weight",
        header: `Peso (${wUnit})`,
        kind: "formula",
        resultKind: "number",
        width: 8,
        formula: (r) => `IF(${r.c("k")}="","",${pick("weight", r.c("k"))})`,
      },
      {
        key: "bmi",
        header: "IMC",
        kind: "formula",
        resultKind: "number",
        width: 7,
        formula: (r) => `IF(${r.c("k")}="","",${pick("bmi", r.c("k"))})`,
      },
      {
        key: "dx",
        header: "Diagnóstico",
        kind: "formula",
        width: 26,
        wrap: true,
        formula: (r) => `IF(${r.c("k")}="","",${pick("dx", r.c("k"))})`,
      },
      {
        key: "tx",
        header: "Tratamiento",
        kind: "formula",
        width: 30,
        wrap: true,
        formula: (r) => `IF(${r.c("k")}="","",${pick("tx", r.c("k"))})`,
      },
      {
        key: "next",
        header: "Próximo control",
        kind: "formula",
        resultKind: "date",
        width: 12,
        formula: (r) => `IF(${r.c("k")}="","",${pick("next", r.c("k"))})`,
      },
    ],
    rows: 20,
    theme,
    ctx,
  });

  // Resumen
  addSheetHeader(sum, {
    title: titleWith(`Resumen ${y}`, config.businessName),
    subtitle: "Consultas por mes y controles próximos.",
    theme,
    width: 5,
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
      {
        key: "upcoming",
        label: "Controles en los próximos 7 días",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: () => `COUNTIFS(${V("control")},"Programado",${V("next")},"<="&TODAY()+7)`,
      },
      {
        key: "missed",
        label: "Controles vencidos sin nueva consulta",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${V("control")},"Vencido")`,
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(1).width = 34;
  const inMonth = (s?: string, e?: string) => `${V("date")},">="&${s},${V("date")},"<="&${e}`;
  addMonthlySummary(sum, {
    startRow: f.nextRow + 1,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Consultas",
        kind: "integer",
        formula: (k) => `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${V("patient")},"<>")`,
      },
      {
        header: "Primeras consultas",
        kind: "integer",
        formula: (k) => `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)},${V("n")},1)`,
      },
    ],
  });

  for (const w of [card, vs, pt, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Historial de consultas",
    description: "Ten a mano los antecedentes y la evolución de cada paciente.",
    steps: [
      "En Pacientes registra los datos generales, alergias, enfermedades crónicas y medicamentos de uso continuo.",
      "En Consultas agrega una fila por consulta con signos vitales, diagnóstico, tratamiento y próximo control.",
      "En Ficha del paciente elige un nombre para ver su resumen y sus últimas 20 consultas, la más reciente primero.",
      "El Resumen cuenta las consultas por mes y los controles de los próximos 7 días.",
    ],
    tips: [
      "La información de salud es confidencial: protege el archivo con contraseña y haz copias de seguridad.",
      "Esta plantilla es un apoyo para el registro y no reemplaza el expediente clínico que exija la normativa de tu país.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
