import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addListsSheet } from "@/lib/excel/lists";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { font, makeTheme, styleCalc, styleHeader, thinBorder } from "@/lib/excel/styles";
import { addCategorySummary, addMonthlySummary, cellsOfRange } from "@/lib/excel/summary";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { ContenidoConfig } from "./form";

const WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const TIME_FMT = "h:mm AM/PM";
const at = (h: number, m = 0) => (h * 60 + m) / 1440;

export const build: TemplateBuild<ContenidoConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const title = titleWith("Calendario de contenido", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const cal = addSheet(wb, "Calendario", {
    tabColor: theme.primary,
    landscape: true,
    showGridLines: false,
  });
  const posts = addSheet(wb, "Publicaciones", {
    freezeRows: 4,
    freezeCols: 1,
    tabColor: theme.primary,
    landscape: true,
  });
  const sum = addSheet(wb, "Resultados", { tabColor: theme.primary });
  const lists = addListsSheet(wb, theme, [
    { key: "networks", title: "Redes", values: config.networks, spare: 6 },
    { key: "pillars", title: "Temas", values: config.pillars, spare: 8 },
    {
      key: "formats",
      title: "Formatos",
      values: [
        "Imagen",
        "Carrusel",
        "Reel o video corto",
        "Historia",
        "Video largo",
        "En vivo",
        "Texto",
      ],
    },
  ]);
  const ex = config.example;
  const net = (i: number) => config.networks[i % config.networks.length]!;
  const pil = (i: number) => config.pillars[i % config.pillars.length]!;

  addSheetHeader(posts, {
    title: "Publicaciones",
    subtitle: "Planifica cada publicación y, ya publicada, anota sus resultados.",
    theme,
    width: 16,
  });
  const pt = addTable(posts, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      {
        key: "day",
        header: "Día",
        kind: "formula",
        width: 10,
        formula: (r) =>
          `IF(${r.c("date")}="","",CHOOSE(WEEKDAY(${r.c("date")},2),${WEEK.map((d) => `"${d}"`).join(",")}))`,
      },
      { key: "time", header: "Hora", kind: "number", numFmt: TIME_FMT, width: 10, align: "center" },
      {
        key: "network",
        header: "Red",
        kind: "list",
        width: 14,
        list: { source: lists.source("networks") },
      },
      {
        key: "format",
        header: "Formato",
        kind: "list",
        width: 15,
        list: { source: lists.source("formats") },
      },
      {
        key: "pillar",
        header: "Tema",
        kind: "list",
        width: 16,
        list: { source: lists.source("pillars") },
      },
      { key: "title", header: "Idea o título", kind: "text", width: 28 },
      { key: "copy", header: "Texto y hashtags", kind: "text", width: 34, wrap: true },
      { key: "cta", header: "Llamado a la acción", kind: "text", width: 18 },
      { key: "owner", header: "Responsable", kind: "text", width: 14 },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 12,
        list: ["Idea", "En diseño", "Listo", "Programado", "Publicado"],
        align: "center",
      },
      { key: "reach", header: "Alcance", kind: "integer", width: 10 },
      { key: "interactions", header: "Interacciones", kind: "integer", width: 11 },
      { key: "messages", header: "Mensajes o clientes", kind: "integer", width: 10 },
      {
        key: "rate",
        header: "Tasa de interacción",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) => `IF(N(${r.c("reach")})=0,"",N(${r.c("interactions")})/${r.c("reach")})`,
      },
      { key: "link", header: "Enlace", kind: "text", width: 22 },
    ],
    rows: config.rows,
    theme,
    ctx,
    autoFilter: true,
    headerHeight: 30,
    example: ex
      ? [
          {
            date: fromToday(-6),
            time: at(19),
            network: net(0),
            format: "Carrusel",
            pillar: pil(0),
            title: "Promo 2x1 de fin de semana",
            cta: "Escríbenos al WhatsApp",
            status: "Publicado",
            reach: 3200,
            interactions: 240,
            messages: 18,
          },
          {
            date: fromToday(-4),
            time: at(12),
            network: net(1),
            format: "Reel o video corto",
            pillar: pil(1),
            title: "3 formas de combinar una blusa",
            status: "Publicado",
            reach: 5400,
            interactions: 610,
            messages: 9,
          },
          {
            date: fromToday(-2),
            time: at(20),
            network: net(2),
            format: "Reel o video corto",
            pillar: pil(3),
            title: "Así preparamos tu pedido",
            status: "Publicado",
            reach: 8100,
            interactions: 950,
            messages: 22,
          },
          {
            date: fromToday(1),
            time: at(19),
            network: net(0),
            format: "Imagen",
            pillar: pil(2),
            title: "Testimonio de clienta",
            status: "Listo",
          },
          {
            date: fromToday(3),
            time: at(18),
            network: net(1),
            format: "Historia",
            pillar: pil(0),
            title: "Encuesta: ¿qué color quieres?",
            status: "Idea",
          },
        ]
      : undefined,
  });
  const P = (k: string) => pt.sheetRange(k);
  const sc = pt.letter("status");
  highlightWhen(
    posts,
    `${sc}${pt.firstRow}:${sc}${pt.lastRow}`,
    `${sc}${pt.firstRow}="Publicado"`,
    { fill: theme.okSoft, bold: true },
    1,
  );
  highlightWhen(
    posts,
    `A${pt.firstRow}:${pt.letter("link")}${pt.lastRow}`,
    `AND($A${pt.firstRow}<>"",$A${pt.firstRow}<TODAY(),$${sc}${pt.firstRow}<>"Publicado")`,
    { fill: theme.dangerSoft },
    2,
  );

  // Vista de calendario del mes
  addSheetHeader(cal, {
    title,
    subtitle: "Elige el año y el mes: cada día muestra la primera publicación y cuántas más hay.",
    theme,
    width: 7,
  });
  const today = new Date();
  const cf = addFields(cal, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "year", label: "Año", kind: "integer", value: y },
      {
        key: "month",
        label: "Mes (1 a 12)",
        kind: "integer",
        value: y === today.getFullYear() ? today.getMonth() + 1 : 1,
      },
    ],
    theme,
    ctx,
  });
  const Y = cf.cell("year");
  const MO = cf.cell("month");
  const headRow = 6;
  WEEK.forEach((d, i) => {
    const c = cal.getCell(headRow, i + 1);
    c.value = d;
    styleHeader(c, theme);
    cal.getColumn(i + 1).width = 20;
  });
  const first = `(DATE(${Y},${MO},1)-WEEKDAY(DATE(${Y},${MO},1),2)+1)`;
  for (let w = 0; w < 6; w++) {
    const dr = headRow + 1 + w * 2;
    const cr = dr + 1;
    for (let d = 0; d < 7; d++) {
      const date = `(${first}+${w * 7 + d})`;
      const dc = cal.getCell(dr, d + 1);
      dc.value = { formula: `${date}` };
      dc.numFmt = "d";
      styleCalc(dc, theme);
      dc.alignment = { horizontal: "right" };
      dc.font = font(theme, { bold: true });
      const cc = cal.getCell(cr, d + 1);
      const addrDate = dc.address;
      cc.value = {
        formula: `IF(COUNTIF(${P("date")},${addrDate})=0,"",INDEX(${P("network")},MATCH(${addrDate},${P("date")},0))&": "&INDEX(${P("title")},MATCH(${addrDate},${P("date")},0))&IF(COUNTIF(${P("date")},${addrDate})>1," (+"&(COUNTIF(${P("date")},${addrDate})-1)&")",""))`,
      };
      cc.alignment = { wrapText: true, vertical: "top" };
      cc.font = font(theme, { size: 9 });
      cc.border = thinBorder(theme.border);
      dc.border = thinBorder(theme.border);
    }
    cal.getRow(cr).height = 48;
    const rng = `A${dr}:G${dr}`;
    highlightWhen(cal, rng, `MONTH(A${dr})<>${MO}`, { color: "#B0B7B4" }, 1);
    highlightWhen(cal, `A${dr}:G${cr}`, `A$${dr}=TODAY()`, { fill: "#FFF2CC" }, 2);
  }

  // Resultados
  addSheetHeader(sum, {
    title: titleWith(`Resultados ${y}`, config.businessName),
    subtitle: "Solo cuenta las publicaciones con estado Publicado.",
    theme,
    width: 6,
  });
  const byNet = addCategorySummary(sum, {
    startRow: 4,
    startCol: 1,
    labelHeader: "Red",
    sourceCells: cellsOfRange(lists.source("networks")),
    values: [
      {
        header: "Publicadas",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${P("network")},${k.labelCell},${P("status")},"Publicado"))`,
      },
      {
        header: "Alcance",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${P("reach")},${P("network")},${k.labelCell},${P("status")},"Publicado"))`,
      },
      {
        header: "Interacciones",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${P("interactions")},${P("network")},${k.labelCell},${P("status")},"Publicado"))`,
      },
      {
        header: "Mensajes",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${P("messages")},${P("network")},${k.labelCell},${P("status")},"Publicado"))`,
      },
      {
        header: "Tasa de interacción",
        kind: "percent",
        formula: (k) =>
          `IF(${k.labelCell}="","",IF(SUMIFS(${P("reach")},${P("network")},${k.labelCell},${P("status")},"Publicado")=0,"",SUMIFS(${P("interactions")},${P("network")},${k.labelCell},${P("status")},"Publicado")/SUMIFS(${P("reach")},${P("network")},${k.labelCell},${P("status")},"Publicado")))`,
        total: false,
      },
    ],
    theme,
    ctx,
    labelWidth: 20,
  });
  const byPillar = addCategorySummary(sum, {
    startRow: byNet.totalRow + 3,
    startCol: 1,
    labelHeader: "Tema",
    sourceCells: cellsOfRange(lists.source("pillars")),
    values: [
      {
        header: "Planificadas",
        kind: "integer",
        formula: (k) => `IF(${k.labelCell}="","",COUNTIFS(${P("pillar")},${k.labelCell}))`,
      },
      {
        header: "Publicadas",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",COUNTIFS(${P("pillar")},${k.labelCell},${P("status")},"Publicado"))`,
      },
      {
        header: "Mensajes",
        kind: "integer",
        formula: (k) =>
          `IF(${k.labelCell}="","",SUMIFS(${P("messages")},${P("pillar")},${k.labelCell},${P("status")},"Publicado"))`,
      },
    ],
    theme,
    ctx,
  });
  const yf = addFields(sum, {
    startRow: byPillar.totalRow + 2,
    labelCol: 1,
    valueCol: 2,
    fields: [{ key: "year", label: "Año", kind: "integer", value: y }],
    theme,
    ctx,
  });
  const inMonth = (s?: string, e?: string) =>
    `${P("date")},">="&${s},${P("date")},"<="&${e},${P("status")},"Publicado"`;
  addMonthlySummary(sum, {
    startRow: yf.nextRow + 1,
    startCol: 1,
    yearCell: yf.cell("year"),
    theme,
    ctx,
    values: [
      {
        header: "Publicadas",
        kind: "integer",
        formula: (k) => `COUNTIFS(${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Alcance",
        kind: "integer",
        formula: (k) => `SUMIFS(${P("reach")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Interacciones",
        kind: "integer",
        formula: (k) => `SUMIFS(${P("interactions")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
      {
        header: "Mensajes",
        kind: "integer",
        formula: (k) => `SUMIFS(${P("messages")},${inMonth(k.monthStart, k.monthEnd)})`,
      },
    ],
  });

  for (const w of [cal, posts, sum]) await protectSheet(w);

  addInstructionsSheet(wb, {
    title: "Calendario de contenido",
    description: "Publica con constancia y descubre qué contenido te trae clientes.",
    steps: [
      "En Publicaciones planifica cada post: fecha, hora, red, formato, tema e idea.",
      "Cambia el estado mientras avanzas (Idea, En diseño, Listo, Programado, Publicado).",
      "Las publicaciones con fecha pasada que no están publicadas se marcan en rojo.",
      "Después de publicar anota alcance, interacciones y mensajes; Resultados compara redes, temas y meses.",
      "En Calendario elige el año y el mes para ver el plan en forma de calendario.",
    ],
    tips: [
      "Alterna temas: no todo debe ser promoción.",
      "Los mensajes o clientes que llegan por cada publicación son la métrica que más importa.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
