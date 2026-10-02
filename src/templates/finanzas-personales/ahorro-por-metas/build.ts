import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { trafficLightScale } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import { fromToday } from "@/templates/shared/register";
import type { TemplateBuild } from "@/templates/types";

import type { MetasConfig } from "./form";

export const build: TemplateBuild<MetasConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = titleWith("Ahorro por metas", config.businessName);
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Metas", { freezeRows: 8, tabColor: theme.primary, landscape: true });
  const mv = addSheet(wb, "Aportes", { freezeRows: 4, tabColor: theme.primary });
  const ex = config.example;
  const gStart = 8;
  const goals = `'Metas'!$A$${gStart + 1}:$A$${gStart + config.goals}`;

  addSheetHeader(mv, {
    title: "Aportes y retiros",
    subtitle: "Cada vez que guardes o saques dinero de una meta.",
    theme,
    width: 5,
  });
  const moves = addTable(mv, {
    startRow: 4,
    columns: [
      { key: "date", header: "Fecha", kind: "date", width: 12 },
      { key: "goal", header: "Meta", kind: "list", width: 24, list: { source: goals } },
      {
        key: "type",
        header: "Tipo",
        kind: "list",
        width: 11,
        list: ["Aporte", "Retiro"],
        align: "center",
      },
      { key: "amount", header: "Monto", kind: "currency", width: 13 },
      { key: "note", header: "Nota", kind: "text", width: 26 },
    ],
    rows: config.movements,
    theme,
    ctx,
    autoFilter: true,
    example: ex
      ? [
          { date: fromToday(-60), goal: "Fondo de emergencia", type: "Aporte", amount: 3000 },
          { date: fromToday(-30), goal: "Fondo de emergencia", type: "Aporte", amount: 3000 },
          { date: fromToday(-30), goal: "Viaje a Roatán", type: "Aporte", amount: 2000 },
          {
            date: fromToday(-10),
            goal: "Fondo de emergencia",
            type: "Retiro",
            amount: 1000,
            note: "Medicina",
          },
        ]
      : undefined,
  });
  const M = (k: string) => moves.sheetRange(k);

  addSheetHeader(ws, {
    title,
    subtitle: "Define tus metas; el avance se calcula con tus aportes.",
    theme,
    width: 11,
  });
  const table = addTable(ws, {
    startRow: gStart,
    columns: [
      { key: "goal", header: "Meta", kind: "text", width: 24 },
      { key: "target", header: "Monto objetivo", kind: "currency", width: 13, total: "sum" },
      { key: "date", header: "Fecha objetivo", kind: "date", width: 12 },
      { key: "planned", header: "Aporte mensual planeado", kind: "currency", width: 13 },
      {
        key: "saved",
        header: "Ahorrado",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("goal")}="","",SUMIFS(${M("amount")},${M("goal")},${r.c("goal")},${M("type")},"Aporte")-SUMIFS(${M("amount")},${M("goal")},${r.c("goal")},${M("type")},"Retiro"))`,
      },
      {
        key: "missing",
        header: "Falta",
        kind: "formula",
        resultKind: "currency",
        width: 13,
        total: "sum",
        formula: (r) => `IF(${r.c("goal")}="","",MAX(0,N(${r.c("target")})-${r.c("saved")}))`,
      },
      {
        key: "progress",
        header: "Avance",
        kind: "formula",
        resultKind: "percent",
        width: 10,
        formula: (r) =>
          `IF(OR(${r.c("goal")}="",N(${r.c("target")})=0),"",MIN(1,${r.c("saved")}/${r.c("target")}))`,
      },
      {
        key: "monthsLeft",
        header: "Meses restantes",
        kind: "formula",
        resultKind: "integer",
        width: 10,
        align: "center",
        formula: (r) =>
          `IF(OR(${r.c("goal")}="",${r.c("date")}=""),"",MAX(0,(YEAR(${r.c("date")})-YEAR(TODAY()))*12+MONTH(${r.c("date")})-MONTH(TODAY())))`,
      },
      {
        key: "needed",
        header: "Necesitas ahorrar al mes",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        formula: (r) =>
          `IF(OR(${r.c("monthsLeft")}="",${r.c("missing")}=""),"",ROUND(${r.c("missing")}/MAX(1,${r.c("monthsLeft")}),2))`,
      },
      {
        key: "eta",
        header: "Llegarás (a tu ritmo)",
        kind: "formula",
        resultKind: "date",
        width: 13,
        formula: (r) =>
          `IF(OR(${r.c("goal")}="",N(${r.c("planned")})=0),"",IF(${r.c("missing")}=0,TODAY(),EDATE(TODAY(),ROUNDUP(${r.c("missing")}/${r.c("planned")},0))))`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "formula",
        width: 13,
        align: "center",
        formula: (r) =>
          `IF(${r.c("goal")}="","",IF(${r.c("missing")}=0,"¡Lograda!",IF(OR(${r.c("eta")}="",${r.c("date")}=""),"",IF(${r.c("eta")}<=${r.c("date")},"A tiempo","Atrasada"))))`,
      },
    ],
    rows: config.goals,
    theme,
    ctx,
    totals: { label: "Total" },
    example: ex
      ? [
          { goal: "Fondo de emergencia", target: 30000, date: fromToday(365), planned: 3000 },
          { goal: "Viaje a Roatán", target: 12000, date: fromToday(150), planned: 1000 },
        ]
      : undefined,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      {
        key: "saved",
        label: "Total ahorrado",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => table.total("saved"),
      },
      {
        key: "progress",
        label: "Avance general",
        kind: "calc",
        resultKind: "percent",
        formula: () =>
          `IF(${table.total("target")}=0,"",${table.total("saved")}/${table.total("target")})`,
      },
    ],
    theme,
    ctx,
  });
  const p = table.letter("progress");
  trafficLightScale(ws, `${p}${table.firstRow}:${p}${table.lastRow}`);
  await protectSheet(ws);
  await protectSheet(mv);

  addInstructionsSheet(wb, {
    title: "Ahorro por metas",
    description: "Ponle nombre a tu ahorro y mira cómo avanza cada meta.",
    steps: [
      "En Metas escribe cada meta con su monto objetivo, la fecha en que la quieres lograr y cuánto planeas aportar al mes.",
      "En Aportes registra cada depósito o retiro eligiendo la meta.",
      "El avance, lo que falta, cuánto necesitas ahorrar al mes y la fecha estimada se calculan solos.",
    ],
    tips: [
      "Empieza por un fondo de emergencia de 3 a 6 meses de tus gastos.",
      "Aparta el ahorro apenas recibas tu salario o remesa, no con lo que sobra.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
