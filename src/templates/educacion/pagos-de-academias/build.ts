import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { offsetCell } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { exampleDate, titleWith } from "@/templates/shared/ledger-form";
import { SHORT_MONTHS, addMemberMatrix } from "@/templates/shared/members";
import type { TemplateBuild } from "@/templates/types";

import type { AcademiaConfig } from "./form";

const EXAMPLE_FEES: [number, number, number][] = [
  [500, 1200, 350],
  [500, 1400, 400],
  [300, 1000, 0],
  [300, 1500, 0],
  [0, 800, 150],
];

export const build: TemplateBuild<AcademiaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith(`Academia ${y}`, config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const crs = addSheet(wb, "Cursos", { freezeRows: 4, tabColor: theme.primary });
  const ws = addSheet(wb, "Alumnos y pagos", {
    freezeRows: 6,
    freezeCols: 1,
    landscape: true,
    tabColor: theme.primary,
  });
  const mat = addSheet(wb, "Materiales y eventos", { freezeRows: 4, tabColor: theme.primary });
  const exp = addSheet(wb, "Gastos", { freezeRows: 4, tabColor: theme.primary });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;
  const courses = config.courses;
  const courseFee = (i: number) => EXAMPLE_FEES[i % EXAMPLE_FEES.length]!;

  // Cursos
  addSheetHeader(crs, {
    title: "Cursos y tarifas",
    subtitle: "La cuota de cada alumno toma la mensualidad de su curso.",
    theme,
    width: 6,
  });
  const ct = addTable(crs, {
    startRow: 4,
    columns: [
      { key: "course", header: "Curso", kind: "text", width: 26 },
      { key: "enroll", header: "Inscripción", kind: "currency", width: 13 },
      { key: "fee", header: "Mensualidad", kind: "currency", width: 13 },
      { key: "materials", header: "Materiales", kind: "currency", width: 13 },
      { key: "schedule", header: "Horario", kind: "text", width: 22 },
      { key: "teacher", header: "Instructor", kind: "text", width: 20 },
    ],
    rows: courses.length + 10,
    theme,
    ctx,
    example: courses.map((course, i) => {
      const [enroll, fee, materials] = courseFee(i);
      return {
        course,
        enroll,
        fee,
        materials,
        ...(ex ? { schedule: "Sábados 8:00 a 10:00", teacher: "Lic. Paredes" } : {}),
      };
    }),
  });
  const C = (k: string) => ct.sheetRange(k);
  const lookup = (key: string, course: string) =>
    `IFERROR(INDEX(${C(key)},MATCH(${course},${C("course")},0)),0)`;

  // Alumnos y pagos por mes
  addSheetHeader(ws, {
    title: titleWith(`Alumnos y mensualidades ${y}`, config.businessName),
    subtitle: "Escribe lo que paga cada alumno en la columna del mes.",
    theme,
    width: 23,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "cut",
        label: "Meses vencidos al corte (1 a 12)",
        kind: "integer",
        value: ex ? 3 : new Date().getMonth() + 1,
      },
    ],
    theme,
    ctx,
  });
  const [e0, f0] = courseFee(0);
  const [e2, f2] = courseFee(2 % courses.length);
  const fee1 = Math.round(f0 * 0.5 * 100) / 100;
  const matrix = addMemberMatrix(ws, {
    startRow: 6,
    rows: config.students,
    months: SHORT_MONTHS,
    monthsDueCell: top.cell("cut"),
    leading: [
      { key: "name", header: "Alumno", kind: "text", width: 26 },
      { key: "phone", header: "Teléfono del encargado", kind: "text", width: 13 },
      { key: "course", header: "Curso", kind: "list", width: 18, list: { source: C("course") } },
      { key: "discount", header: "Descuento o beca", kind: "percent", width: 10 },
      {
        key: "fee",
        header: "Cuota",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) =>
          `IF(${r.c("name")}="","",ROUND(${lookup("fee", r.c("course"))}*(1-N(${r.c("discount")})),2))`,
      },
      {
        key: "enroll",
        header: "Inscripción",
        kind: "formula",
        resultKind: "currency",
        width: 11,
        formula: (r) => `IF(${r.c("name")}="","",${lookup("enroll", r.c("course"))})`,
      },
      {
        key: "enrollPaid",
        header: "Inscripción pagada",
        kind: "currency",
        width: 11,
        total: "sum",
      },
    ],
    feeKey: "fee",
    oneTimeKey: "enroll",
    oneTimePaidKey: "enrollPaid",
    theme,
    ctx,
    example: ex
      ? [
          {
            name: "Sofía Aguilar",
            phone: "9876-1111",
            course: courses[0],
            enrollPaid: e0,
            m0: f0,
            m1: f0,
            m2: f0,
          },
          {
            name: "Diego Núñez",
            phone: "3322-4455",
            course: courses[0],
            discount: 0.5,
            enrollPaid: e0,
            m0: fee1,
            m1: fee1,
            m2: fee1,
          },
          { name: "Valeria Turcios", course: courses[2 % courses.length], enrollPaid: e2, m0: f2 },
        ]
      : undefined,
  });
  const M = (k: string) => matrix.sheetRange(k);

  // Materiales y eventos
  addSheetHeader(mat, {
    title: "Materiales, uniformes y eventos",
    subtitle: "Cobros adicionales por alumno.",
    theme,
    width: 7,
  });
  const mt = addTable(mat, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "student", header: "Alumno", kind: "list", width: 26, list: { source: M("name") } },
      {
        key: "concept",
        header: "Concepto",
        kind: "list",
        width: 16,
        list: ["Materiales", "Libro", "Uniforme", "Examen", "Recital o evento", "Otro"],
      },
      { key: "charged", header: "Cobrado", kind: "currency", width: 12, total: "sum" },
      { key: "paid", header: "Pagado", kind: "currency", width: 12, total: "sum" },
      {
        key: "balance",
        header: "Saldo",
        kind: "formula",
        resultKind: "currency",
        width: 12,
        total: "sum",
        formula: (r) => `IF(${r.c("student")}="","",MAX(0,${r.c("charged")}-${r.c("paid")}))`,
      },
      { key: "note", header: "Nota", kind: "text", width: 22 },
    ],
    rows: 1000,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 15),
            student: "Sofía Aguilar",
            concept: "Libro",
            charged: 350,
            paid: 200,
          },
        ]
      : undefined,
  });
  const T = (k: string) => mt.sheetRange(k);

  // Gastos
  addSheetHeader(exp, {
    title: "Gastos de la academia",
    subtitle: "Instructores, alquiler, servicios y materiales.",
    theme,
    width: 5,
  });
  const gt = addTable(exp, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "category",
        header: "Categoría",
        kind: "list",
        width: 18,
        list: [
          "Instructores",
          "Alquiler",
          "Energía y agua",
          "Internet",
          "Materiales",
          "Publicidad",
          "Mantenimiento",
          "Otros",
        ],
      },
      { key: "detail", header: "Detalle", kind: "text", width: 30 },
      { key: "amount", header: "Monto", kind: "currency", width: 13, total: "sum" },
      { key: "receipt", header: "Comprobante", kind: "text", width: 14 },
    ],
    rows: 1000,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          {
            date: exampleDate(y, 1, 30),
            category: "Alquiler",
            detail: "Local de enero",
            amount: 2500,
          },
        ]
      : undefined,
  });
  const G = (k: string) => gt.sheetRange(k);

  // Resumen
  addSheetHeader(sum, {
    title: `Resumen ${y}`,
    subtitle: "Alumnos, cobros y pendientes por curso y resultado por mes.",
    theme,
    width: 6,
  });
  const f = addFields(sum, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const bc = addCategorySummary(sum, {
    startRow: 5,
    startCol: 1,
    labelHeader: "Curso",
    sourceCells: cellsOfRange(C("course")),
    values: [
      {
        header: "Alumnos",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${M("course")},${k.labelCell},${M("name")},"<>"))`,
      },
      {
        header: "Cobrado",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${M("paid")},${M("course")},${k.labelCell}))`,
      },
      {
        header: "Pendiente",
        kind: "currency",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${M("balance")},${M("course")},${k.labelCell}))`,
      },
      {
        header: "Morosos",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${M("course")},${k.labelCell},${M("status")},"Moroso"))`,
      },
    ],
    theme,
    ctx,
    labelWidth: 26,
  });
  const inRange = (col: string, s?: string, e?: string) => `${col},">="&${s},${col},"<="&${e}`;
  const monthly = addMonthlySummary(sum, {
    startRow: bc.totalRow + 3,
    startCol: 1,
    yearCell: f.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Mensualidades",
        kind: "currency",
        formula: (k) =>
          `'Alumnos y pagos'!$${matrix.letter(`m${k.month! - 1}`)}$${matrix.totalRow}`,
      },
      {
        header: "Materiales y eventos",
        kind: "currency",
        formula: (k) => `SUMIFS(${T("paid")},${inRange(T("date"), k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Gastos",
        kind: "currency",
        formula: (k) => `SUMIFS(${G("amount")},${inRange(G("date"), k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Resultado",
        kind: "currency",
        formula: (k) =>
          `${offsetCell(k.labelCell, 1)}+${offsetCell(k.labelCell, 2)}-${offsetCell(k.labelCell, 3)}`,
      },
    ],
  });
  addFields(sum, {
    startRow: monthly.totalRow + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "enroll",
        label: "Inscripciones cobradas",
        kind: "calc",
        resultKind: "currency",
        formula: () => matrix.sheetTotal("enrollPaid"),
      },
      {
        key: "matPending",
        label: "Materiales por cobrar",
        kind: "calc",
        resultKind: "currency",
        formula: () => mt.sheetTotal("balance"),
      },
      {
        key: "net",
        label: "Resultado del año (con inscripciones)",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (c) => `${monthly.totalCell(3)}+${c("enroll")}`,
      },
    ],
    theme,
    ctx,
  });

  for (const w of [crs, ws, mat, exp, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Pagos de academias",
    description: "Lleva inscripciones, mensualidades y cobros extra de tu academia sin cuadernos.",
    steps: [
      "En Cursos escribe la inscripción, la mensualidad y el costo de materiales de cada curso.",
      "En Alumnos y pagos escribe cada alumno, elige su curso y, si tiene beca o descuento, su porcentaje.",
      "Anota cada pago en la columna del mes y la inscripción cuando la entregue; actualiza los meses vencidos al corte.",
      "Registra materiales, uniformes, eventos y gastos; el Resumen muestra cobros por curso y el resultado por mes.",
    ],
    tips: ["Para hermanos o becados usa el descuento: 50 % paga la mitad de la mensualidad."],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 1);
  return wb;
};
