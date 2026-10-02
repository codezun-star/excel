import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { lighten, makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { SaludConfig } from "./form";

const LB_TO_KG = 0.45359237;
const TIME_FMT = "h:mm AM/PM";
const at = (h: number, m = 0) => (h * 60 + m) / 1440;

export const build: TemplateBuild<SaludConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const lb = config.weightUnit === "lb";
  const unit = lb ? "lb" : "kg";
  const wb = createWorkbook({ title: "Seguimiento de salud", ctx, options });
  const log = addSheet(wb, "Mediciones", {
    freezeRows: 4,
    freezeCols: 1,
    tabColor: theme.primary,
    landscape: true,
  });
  const ppl = addSheet(wb, "Personas", { freezeRows: 4, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ref = addSheet(wb, "Rangos", { tabColor: theme.highlight });
  const ex = config.example;
  const people = config.people;

  // Rangos de referencia (editables por indicación médica)
  addSheetHeader(ref, {
    title: "Rangos de referencia",
    subtitle: "Valores habituales para adultos. Ajústalos si tu médico te indica otras metas.",
    theme,
    width: 3,
  });
  const R = addFields(ref, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "sysElev", label: "Presión sistólica elevada desde", kind: "integer", value: 120 },
      { key: "sys1", label: "Hipertensión etapa 1: sistólica desde", kind: "integer", value: 130 },
      { key: "dia1", label: "Hipertensión etapa 1: diastólica desde", kind: "integer", value: 80 },
      { key: "sys2", label: "Hipertensión etapa 2: sistólica desde", kind: "integer", value: 140 },
      { key: "dia2", label: "Hipertensión etapa 2: diastólica desde", kind: "integer", value: 90 },
      { key: "sysCrisis", label: "Crisis: sistólica mayor que", kind: "integer", value: 180 },
      { key: "diaCrisis", label: "Crisis: diastólica mayor que", kind: "integer", value: 120 },
      { key: "sysLow", label: "Presión baja: sistólica menor que", kind: "integer", value: 90 },
      {
        key: "gFastPre",
        label: "Glucosa en ayunas: prediabetes desde (mg/dL)",
        kind: "integer",
        value: 100,
      },
      {
        key: "gFastHigh",
        label: "Glucosa en ayunas: alta desde (mg/dL)",
        kind: "integer",
        value: 126,
      },
      {
        key: "gPostPre",
        label: "Glucosa después de comer: elevada desde",
        kind: "integer",
        value: 140,
      },
      {
        key: "gPostHigh",
        label: "Glucosa después de comer: alta desde",
        kind: "integer",
        value: 200,
      },
      { key: "gLow", label: "Glucosa baja: menor que (mg/dL)", kind: "integer", value: 70 },
      { key: "bmiLow", label: "IMC bajo peso: menor que", kind: "number", value: 18.5 },
      { key: "bmiOver", label: "IMC sobrepeso desde", kind: "number", value: 25 },
      { key: "bmiObese", label: "IMC obesidad desde", kind: "number", value: 30 },
    ],
    theme,
    ctx,
  });
  ref.getColumn(1).width = 44;
  const K = (k: string) => R.ref(k);

  // Personas
  addSheetHeader(ppl, {
    title: "Personas",
    subtitle: "La talla se usa para calcular el IMC.",
    theme,
    width: 4,
  });
  const pt = addTable(ppl, {
    startRow: 4,
    columns: [
      { key: "name", header: "Nombre", kind: "text", width: 22 },
      { key: "birth", header: "Fecha de nacimiento", kind: "date", width: 13 },
      { key: "height", header: "Talla (cm)", kind: "number", width: 10 },
      { key: "goal", header: `Peso meta (${unit})`, kind: "number", width: 11 },
    ],
    rows: people.length + 5,
    theme,
    ctx,
    example: people.map((name) => ({ name, ...(ex ? { height: 160, goal: lb ? 150 : 68 } : {}) })),
  });
  const PP = (k: string) => pt.sheetRange(k);

  // Mediciones
  addSheetHeader(log, {
    title: "Mediciones",
    subtitle:
      "Mide la presión sentado y en reposo; anota la glucosa con el momento de la medición.",
    theme,
    width: 13,
  });
  const lt = addTable(log, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "time", header: "Hora", kind: "number", numFmt: TIME_FMT, width: 10, align: "center" },
      { key: "person", header: "Persona", kind: "list", width: 14, list: { source: PP("name") } },
      { key: "sys", header: "Sistólica", kind: "integer", width: 9 },
      { key: "dia", header: "Diastólica", kind: "integer", width: 9 },
      { key: "pulse", header: "Pulso", kind: "integer", width: 8 },
      {
        key: "bp",
        header: "Presión",
        kind: "formula",
        width: 15,
        align: "center",
        formula: (r) => {
          const s = `${r.c("sys")}`;
          const d = `N(${r.c("dia")})`;
          return `IF(N(${s})=0,"",IF(OR(${s}>${K("sysCrisis")},${d}>${K("diaCrisis")}),"Crisis",IF(OR(${s}>=${K("sys2")},${d}>=${K("dia2")}),"Hipertensión 2",IF(OR(${s}>=${K("sys1")},${d}>=${K("dia1")}),"Hipertensión 1",IF(${s}>=${K("sysElev")},"Elevada",IF(${s}<${K("sysLow")},"Baja","Normal"))))))`;
        },
      },
      { key: "glucose", header: "Glucosa (mg/dL)", kind: "integer", width: 10 },
      {
        key: "moment",
        header: "Momento",
        kind: "list",
        width: 16,
        list: ["En ayunas", "2 h después de comer", "Al azar"],
      },
      {
        key: "gl",
        header: "Glucosa",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) => {
          const g = r.c("glucose");
          const post = `${r.c("moment")}<>"En ayunas"`;
          return `IF(N(${g})=0,"",IF(${g}<${K("gLow")},"Baja",IF(${post},IF(${g}>=${K("gPostHigh")},"Alta",IF(${g}>=${K("gPostPre")},"Elevada","Normal")),IF(${g}>=${K("gFastHigh")},"Alta",IF(${g}>=${K("gFastPre")},"Prediabetes","Normal")))))`;
        },
      },
      { key: "weight", header: `Peso (${unit})`, kind: "number", width: 9 },
      {
        key: "bmi",
        header: "IMC",
        kind: "formula",
        resultKind: "number",
        width: 8,
        formula: (r) => {
          const h = `IFERROR(INDEX(${PP("height")},MATCH(${r.c("person")},${PP("name")},0)),0)`;
          return `IF(OR(N(${r.c("weight")})=0,N(${h})=0),"",ROUND(${r.c("weight")}${lb ? `*${LB_TO_KG}` : ""}/(${h}/100)^2,1))`;
        },
      },
      {
        key: "bmiClass",
        header: "Peso según IMC",
        kind: "formula",
        width: 12,
        align: "center",
        formula: (r) =>
          `IF(${r.c("bmi")}="","",IF(${r.c("bmi")}<${K("bmiLow")},"Bajo",IF(${r.c("bmi")}>=${K("bmiObese")},"Obesidad",IF(${r.c("bmi")}>=${K("bmiOver")},"Sobrepeso","Normal"))))`,
      },
      {
        key: "alert",
        header: "Alerta",
        kind: "formula",
        width: 8,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("bp")}="Crisis",${r.c("bp")}="Hipertensión 2",${r.c("bp")}="Baja",${r.c("gl")}="Alta",${r.c("gl")}="Baja"),"Sí","")`,
      },
      { key: "notes", header: "Notas", kind: "text", width: 24 },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          {
            date: fromToday(-20),
            time: at(7),
            person: people[0],
            sys: 142,
            dia: 92,
            pulse: 78,
            glucose: 118,
            moment: "En ayunas",
            weight: lb ? 172 : 78,
          },
          {
            date: fromToday(-10),
            time: at(7),
            person: people[0],
            sys: 128,
            dia: 82,
            pulse: 74,
            glucose: 160,
            moment: "2 h después de comer",
          },
          {
            date: fromToday(-2),
            time: at(7, 30),
            person: people[0],
            sys: 118,
            dia: 76,
            pulse: 70,
            glucose: 96,
            moment: "En ayunas",
            weight: lb ? 168 : 76,
          },
        ]
      : undefined,
  });
  const L = (k: string) => lt.sheetRange(k);
  const rowRange = `A${lt.firstRow}:${lt.letter("notes")}${lt.lastRow}`;
  const al = lt.letter("alert");
  highlightWhen(log, rowRange, `$${al}${lt.firstRow}="Sí"`, { fill: theme.dangerSoft }, 1);
  for (const [key, warn] of [
    [
      "bp",
      `OR(${lt.letter("bp")}${lt.firstRow}="Elevada",${lt.letter("bp")}${lt.firstRow}="Hipertensión 1")`,
    ],
    [
      "gl",
      `OR(${lt.letter("gl")}${lt.firstRow}="Elevada",${lt.letter("gl")}${lt.firstRow}="Prediabetes")`,
    ],
    [
      "bmiClass",
      `OR(${lt.letter("bmiClass")}${lt.firstRow}="Sobrepeso",${lt.letter("bmiClass")}${lt.firstRow}="Bajo")`,
    ],
  ] as const) {
    const c = lt.letter(key);
    highlightWhen(
      log,
      `${c}${lt.firstRow}:${c}${lt.lastRow}`,
      warn,
      { fill: lighten(theme.highlight, 0.6), bold: true },
      2,
    );
  }

  // Resumen por persona y evolución mensual
  addSheetHeader(sum, {
    title: "Resumen de salud",
    subtitle: "Promedios de los últimos 30 días y evolución por mes. Llévalo a tu cita médica.",
    theme,
    width: 7,
  });
  const last30 = `${L("date")},">="&TODAY()-30`;
  const avg = (col: string, label: string, extra = "") =>
    `IF(${label}="","",IF(COUNTIFS(${L("person")},${label},${last30}${extra})=0,"Sin datos",ROUND(SUMIFS(${L(col)},${L("person")},${label},${last30}${extra})/COUNTIFS(${L("person")},${label},${last30}${extra}),0)))`;
  const byPerson = addCategorySummary(sum, {
    startRow: 4,
    startCol: 1,
    labelHeader: "Persona",
    sourceCells: cellsOfRange(PP("name")),
    values: [
      {
        header: "Sistólica (30 días)",
        kind: "integer",
        formula: (k) => avg("sys", k.labelCell, `,${L("sys")},">0"`),
        total: false,
      },
      {
        header: "Diastólica (30 días)",
        kind: "integer",
        formula: (k) => avg("dia", k.labelCell, `,${L("dia")},">0"`),
        total: false,
      },
      {
        header: "Glucosa en ayunas (30 días)",
        kind: "integer",
        formula: (k) =>
          avg("glucose", k.labelCell, `,${L("moment")},"En ayunas",${L("glucose")},">0"`),
        total: false,
      },
      {
        header: "Alertas (30 días)",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${L("person")},${k.labelCell},${L("alert")},"Sí",${last30}))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 18,
  });
  const f = addFields(sum, {
    startRow: byPerson.totalRow + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "person",
        label: "Persona",
        kind: "list",
        list: { source: PP("name") },
        value: people[0],
      },
      { key: "year", label: "Año", kind: "integer", value: y },
    ],
    theme,
    ctx,
  });
  const P = f.cell("person");
  const inMonth = (s?: string, e?: string) =>
    `${L("date")},">="&${s},${L("date")},"<="&${e},${L("person")},${P}`;
  const mAvg = (col: string, s?: string, e?: string, extra = "") =>
    `IF(COUNTIFS(${inMonth(s, e)},${L(col)},">0"${extra})=0,"",ROUND(SUMIFS(${L(col)},${inMonth(s, e)},${L(col)},">0"${extra})/COUNTIFS(${inMonth(s, e)},${L(col)},">0"${extra}),1))`;
  addMonthlySummary(sum, {
    startRow: f.nextRow + 1,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Sistólica promedio",
        kind: "number",
        formula: (k) => mAvg("sys", k.monthStart, k.monthEnd),
        total: false,
      },
      {
        header: "Diastólica promedio",
        kind: "number",
        formula: (k) => mAvg("dia", k.monthStart, k.monthEnd),
        total: false,
      },
      {
        header: "Glucosa en ayunas",
        kind: "number",
        formula: (k) => mAvg("glucose", k.monthStart, k.monthEnd, `,${L("moment")},"En ayunas"`),
        total: false,
      },
      {
        header: `Peso promedio (${unit})`,
        kind: "number",
        formula: (k) => mAvg("weight", k.monthStart, k.monthEnd),
        total: false,
      },
      {
        header: "Mediciones",
        kind: "integer",
        formula: (k) => `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)})`,
      },
    ],
  });

  for (const w of [log, ppl, sum, ref]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Seguimiento de salud",
    description: "Registra tus mediciones y lleva datos claros a tu médico.",
    steps: [
      "En Personas escribe el nombre y la talla en centímetros de cada persona.",
      "En Mediciones anota fecha, hora, persona y los valores que midas; puedes dejar vacío lo que no midas ese día.",
      "La presión, la glucosa y el IMC se clasifican solos; las alertas se pintan en rojo.",
      "El Resumen muestra promedios de los últimos 30 días y la evolución por mes de la persona elegida.",
    ],
    tips: [
      "Esta plantilla no sustituye la consulta médica. Ante una crisis de presión o glucosa muy alta o baja busca atención de inmediato.",
      "Si tu médico te dio otras metas, cámbialas en la hoja Rangos.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
