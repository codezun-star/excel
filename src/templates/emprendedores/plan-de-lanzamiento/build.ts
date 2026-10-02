import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { lighten, makeTheme, styleHeader } from "@/lib/excel/styles";
import { addCategorySummary } from "@/lib/excel/summary";
import { addTable, type ColumnDef } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { LanzamientoConfig } from "./form";

const PHASES = ["Preparación", "Prelanzamiento", "Lanzamiento", "Poslanzamiento"];
const WEEKS = 12;

/** Tareas base: fase, tarea, días antes del lanzamiento (negativo = después), duración y presupuesto de ejemplo. */
const TASKS: [string, string, number, number, number][] = [
  ["Preparación", "Definir el producto, el cliente ideal y el precio", 45, 5, 0],
  ["Preparación", "Calcular costos y margen", 42, 3, 0],
  ["Preparación", "Elegir proveedores y pedir cotizaciones", 40, 7, 0],
  ["Preparación", "Trámites y permisos necesarios", 40, 14, 2500],
  ["Preparación", "Nombre, logo y empaque", 35, 10, 4000],
  ["Preparación", "Fotos y videos del producto", 28, 4, 3000],
  ["Prelanzamiento", "Crear o actualizar perfiles en redes y WhatsApp Business", 25, 3, 0],
  ["Prelanzamiento", "Preparar catálogo o menú con precios", 21, 4, 500],
  ["Prelanzamiento", "Comprar inventario inicial", 18, 5, 15000],
  ["Prelanzamiento", "Publicaciones de expectativa", 14, 14, 0],
  ["Prelanzamiento", "Capacitar al equipo en ventas y atención", 10, 2, 0],
  ["Prelanzamiento", "Invitar a clientes, familiares y contactos", 7, 7, 0],
  ["Prelanzamiento", "Contactar creadores de contenido locales", 10, 5, 2000],
  ["Prelanzamiento", "Programar anuncios pagados", 5, 5, 3000],
  ["Lanzamiento", "Publicación o evento de lanzamiento", 0, 1, 2500],
  ["Lanzamiento", "Promoción de apertura", 0, 7, 1500],
  ["Lanzamiento", "Responder mensajes y entregar pedidos a tiempo", 0, 7, 0],
  ["Poslanzamiento", "Pedir reseñas y testimonios", -7, 7, 0],
  ["Poslanzamiento", "Medir ventas y mensajes de la primera semana", -8, 2, 0],
  ["Poslanzamiento", "Ajustar precios, contenido y anuncios", -10, 5, 0],
  ["Poslanzamiento", "Seguimiento a clientes para la segunda compra", -14, 14, 0],
];

export const build: TemplateBuild<LanzamientoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Plan de lanzamiento", config.product || config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Plan", {
    freezeRows: 7,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const sum = addSheet(wb, "Resumen", { tabColor: theme.primary });
  const ex = config.example;

  addSheetHeader(ws, {
    title,
    subtitle: "Cambia la fecha del lanzamiento y todas las fechas se mueven solas.",
    theme,
    width: 13 + WEEKS,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "launch",
        label: "Fecha del lanzamiento",
        kind: "date",
        value: config.launch || fromToday(45),
      },
      {
        key: "left",
        label: "Días para el lanzamiento",
        kind: "calc",
        resultKind: "integer",
        emphasis: true,
        formula: (c) => `${c("launch")}-TODAY()`,
      },
    ],
    theme,
    ctx,
  });
  const LAUNCH = top.cell("launch");
  const done = (r: { c: (k: string) => string }) => `${r.c("status")}="Hecho"`;
  const base: ColumnDef[] = [
    { key: "phase", header: "Fase", kind: "list", width: 14, list: PHASES },
    { key: "task", header: "Tarea", kind: "text", width: 40 },
    { key: "owner", header: "Responsable", kind: "text", width: 14 },
    {
      key: "before",
      header: "Días antes del lanzamiento",
      kind: "integer",
      width: 10,
      allowNegative: true,
      min: -365,
      note: "Usa números negativos para tareas después del lanzamiento.",
    },
    { key: "duration", header: "Duración (días)", kind: "integer", width: 9 },
    {
      key: "start",
      header: "Inicio",
      kind: "formula",
      resultKind: "date",
      width: 11,
      formula: (r) => `IF(OR(${r.c("task")}="",${r.c("before")}=""),"",${LAUNCH}-${r.c("before")})`,
    },
    {
      key: "end",
      header: "Fin",
      kind: "formula",
      resultKind: "date",
      width: 11,
      formula: (r) => `IF(${r.c("start")}="","",${r.c("start")}+MAX(1,N(${r.c("duration")}))-1)`,
    },
    {
      key: "status",
      header: "Estado",
      kind: "list",
      width: 11,
      list: ["Pendiente", "En proceso", "Hecho"],
      align: "center",
      fill: "Pendiente",
    },
    {
      key: "alert",
      header: "Alerta",
      kind: "formula",
      width: 10,
      align: "center",
      formula: (r) =>
        `IF(OR(${r.c("start")}="",${done(r)}),"",IF(${r.c("end")}<TODAY(),"Atrasada",IF(${r.c("start")}<=TODAY(),"Esta semana","")))`,
    },
    { key: "budget", header: "Presupuesto", kind: "currency", width: 12, total: "sum" },
    { key: "spent", header: "Gasto real", kind: "currency", width: 12, total: "sum" },
  ];
  const headerRow = 7;
  const firstRow = headerRow + 1;
  const gStartCol = base.length + 1;
  const weekHeader = (i: number) => `${ws.getColumn(gStartCol + i).letter}$${headerRow}`;
  const gantt: ColumnDef[] = Array.from({ length: WEEKS }, (_, i) => ({
    key: `w${i}`,
    header: `S${i + 1}`,
    kind: "formula",
    width: 6,
    align: "center",
    formula: (r) =>
      `IF(AND(${r.c("start")}<>"",${r.c("start")}<=${weekHeader(i)}+6,${r.c("end")}>=${weekHeader(i)}),IF(${r.c("status")}="Hecho","✓",""),"")`,
  }));
  const rows = TASKS.length + 15;
  const table = addTable(ws, {
    startRow: headerRow,
    columns: [...base, ...gantt],
    rows,
    theme,
    ctx,
    totals: { label: "Totales" },
    autoFilter: true,
    headerHeight: 34,
    example: TASKS.map(([phase, task, before, duration, budget], i) => ({
      phase,
      task,
      before,
      duration,
      budget: ex ? budget || undefined : undefined,
      owner: ex ? (i % 3 === 0 ? "Andrea" : i % 3 === 1 ? "Luis" : "Equipo") : undefined,
      status: ex ? (before >= 35 ? "Hecho" : before >= 25 ? "En proceso" : undefined) : undefined,
      spent: ex && before >= 35 && budget ? budget * 0.9 : undefined,
    })),
  });
  if (table.firstRow !== firstRow) throw new Error("Fila inicial inesperada");
  // Encabezados de semana: lunes de la semana en que empieza la primera tarea
  const startRange = table.range("start");
  for (let i = 0; i < WEEKS; i++) {
    const c = ws.getCell(headerRow, gStartCol + i);
    c.value = {
      formula: `IF(COUNT(${startRange})=0,${LAUNCH}-WEEKDAY(${LAUNCH},2)+1-42,MIN(${startRange})-WEEKDAY(MIN(${startRange}),2)+1)+${i * 7}`,
    };
    c.numFmt = "d mmm";
    styleHeader(c, theme);
  }
  const g1 = ws.getColumn(gStartCol).letter;
  const g2 = ws.getColumn(gStartCol + WEEKS - 1).letter;
  const S = table.letter("start");
  const E = table.letter("end");
  const ST = table.letter("status");
  const grid = `${g1}${firstRow}:${g2}${table.lastRow}`;
  const cellOverlap = `AND($${S}${firstRow}<>"",$${S}${firstRow}<=${g1}$${headerRow}+6,$${E}${firstRow}>=${g1}$${headerRow})`;
  highlightWhen(
    ws,
    grid,
    `AND(${cellOverlap},$${ST}${firstRow}="Hecho")`,
    { fill: theme.okSoft, color: theme.primaryDark, bold: true },
    1,
  );
  highlightWhen(
    ws,
    grid,
    `AND(${cellOverlap},$${E}${firstRow}<TODAY())`,
    { fill: theme.dangerSoft },
    2,
  );
  highlightWhen(ws, grid, cellOverlap, { fill: lighten(theme.primary, 0.55) }, 3);
  highlightWhen(
    ws,
    grid,
    `AND(${LAUNCH}>=${g1}$${headerRow},${LAUNCH}<=${g1}$${headerRow}+6)`,
    { fill: lighten(theme.highlight, 0.7) },
    4,
  );
  const al = table.letter("alert");
  highlightWhen(
    ws,
    `${al}${firstRow}:${al}${table.lastRow}`,
    `${al}${firstRow}="Atrasada"`,
    { fill: theme.dangerSoft, bold: true },
    5,
  );

  // Resumen
  addSheetHeader(sum, {
    title: titleWith("Avance del lanzamiento", config.product || config.businessName),
    subtitle: "Tareas, avance y presupuesto por fase.",
    theme,
    width: 6,
  });
  const T = (k: string) => table.sheetRange(k);
  const bp = addCategorySummary(sum, {
    startRow: 4,
    startCol: 1,
    labelHeader: "Fase",
    sourceCells: PHASES.map((p) => `"${p}"`),
    values: [
      {
        header: "Tareas",
        kind: "integer",
        formula: (k) => `COUNTIFS(${T("phase")},${k.labelCell},${T("task")},"<>")`,
      },
      {
        header: "Hechas",
        kind: "integer",
        formula: (k) => `COUNTIFS(${T("phase")},${k.labelCell},${T("status")},"Hecho")`,
      },
      {
        header: "Avance",
        kind: "percent",
        formula: (k) =>
          `IF(COUNTIFS(${T("phase")},${k.labelCell},${T("task")},"<>")=0,"",COUNTIFS(${T("phase")},${k.labelCell},${T("status")},"Hecho")/COUNTIFS(${T("phase")},${k.labelCell},${T("task")},"<>"))`,
        total: false,
      },
      {
        header: "Presupuesto",
        kind: "currency",
        formula: (k) => `SUMIFS(${T("budget")},${T("phase")},${k.labelCell})`,
      },
      {
        header: "Gasto real",
        kind: "currency",
        formula: (k) => `SUMIFS(${T("spent")},${T("phase")},${k.labelCell})`,
      },
    ],
    theme,
    ctx,
    labelWidth: 18,
  });
  addFields(sum, {
    startRow: bp.totalRow + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "left",
        label: "Días para el lanzamiento",
        kind: "calc",
        resultKind: "integer",
        formula: () => top.ref("left"),
      },
      {
        key: "progress",
        label: "Avance total",
        kind: "calc",
        resultKind: "percent",
        emphasis: true,
        formula: () => `IF(${bp.totalCell(0)}=0,0,${bp.totalCell(1)}/${bp.totalCell(0)})`,
      },
      {
        key: "late",
        label: "Tareas atrasadas",
        kind: "calc",
        resultKind: "integer",
        formula: () => `COUNTIF(${T("alert")},"Atrasada")`,
      },
      {
        key: "available",
        label: "Presupuesto disponible",
        kind: "calc",
        resultKind: "currency",
        formula: () => `${bp.totalCell(3)}-${bp.totalCell(4)}`,
      },
    ],
    theme,
    ctx,
  });
  sum.getColumn(1).width = 26;

  for (const w of [ws, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Plan de lanzamiento",
    description: "Organiza cada paso del lanzamiento para llegar listo al gran día.",
    steps: [
      "Escribe la fecha del lanzamiento: las fechas de inicio y fin de cada tarea se calculan solas.",
      "Revisa las tareas ya escritas, borra las que no apliquen y agrega las tuyas con sus días antes del lanzamiento.",
      "Asigna un responsable y actualiza el estado; las tareas atrasadas se marcan en rojo.",
      "El diagrama de Gantt pinta las semanas de cada tarea; la semana del lanzamiento va en amarillo.",
      "El Resumen muestra el avance y el presupuesto por fase.",
    ],
    tips: [
      "Para tareas después del lanzamiento usa días negativos (−7 = una semana después).",
      "Deja un margen del 10 % del presupuesto para imprevistos.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
