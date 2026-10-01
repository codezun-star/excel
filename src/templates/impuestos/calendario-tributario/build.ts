import "server-only";

import { addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { MONTHS_ES } from "@/lib/excel/summary";
import { addTable, type CellInput } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { CalendarioConfig } from "./form";

const MONTH_INDEX: Record<string, number> = Object.fromEntries(
  MONTHS_ES.map((m, i) => [m.toLowerCase(), i + 1]),
);

export const build: TemplateBuild<CalendarioConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const y = config.year;
  const st = ctx.taxes.salesTax;
  const it = ctx.taxes.incomeTax;
  const wb = createWorkbook({
    title: titleWith(`Calendario tributario ${y}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Calendario", {
    freezeRows: 4,
    landscape: true,
    tabColor: theme.primary,
  });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      {
        title: "Vencimientos",
        rows: [
          { key: "year", label: "Año del calendario", value: y, kind: "integer" },
          {
            key: "isvDay",
            label: `Día de vencimiento del ${st.name} (mes siguiente)`,
            value: st.filingDueDay,
            kind: "integer",
          },
          {
            key: "isrMonth",
            label: `Mes de vencimiento del ${it.name} anual`,
            value: it.annualFilingDue.month,
            kind: "integer",
          },
          {
            key: "isrDay",
            label: `Día de vencimiento del ${it.name} anual`,
            value: it.annualFilingDue.day,
            kind: "integer",
          },
        ],
      },
    ],
  });
  const P = params.ref;

  // Filas predefinidas: la fecha se calcula con fórmula desde Parámetros
  type Row = { obligation: string; period: string; due: string };
  const rows: Row[] = [];
  for (let m = 1; m <= 12; m++) {
    rows.push({
      obligation: `Declaración y pago del ${st.name}`,
      period: `${MONTHS_ES[m - 1]} ${y}`,
      due: `WORKDAY(DATE(${P("year")},${m + 1},${P("isvDay")})-1,1)`,
    });
  }
  rows.push({
    obligation: `Declaración anual del ${it.name}`,
    period: `Año ${y - 1}`,
    due: `WORKDAY(DATE(${P("year")},${P("isrMonth")},${P("isrDay")})-1,1)`,
  });
  const laborRow = (label: string, deadline: string) => {
    const m = MONTH_INDEX[deadline.toLowerCase()];
    if (m)
      rows.push({
        obligation: `Pago del ${label.toLowerCase()}`,
        period: `${y}`,
        due: `EOMONTH(DATE(${P("year")},${m},1),0)`,
      });
  };
  laborRow(ctx.labor.fourteenthMonth.label, ctx.labor.fourteenthMonth.paymentDeadline);
  laborRow(ctx.labor.thirteenthMonth.label, ctx.labor.thirteenthMonth.paymentDeadline);
  const predefined = rows.length;

  addSheetHeader(ws, {
    title: titleWith(`Calendario tributario ${y}`, config.businessName),
    subtitle:
      "Las fechas que caen en fin de semana se corren al siguiente día hábil (no se consideran feriados). Agrega tus obligaciones propias al final.",
    theme,
    width: 8,
  });
  const example: Record<string, CellInput>[] = rows.map((r, i) => ({
    obligation: r.obligation,
    period: r.period,
    status: config.example && i < 2 ? "Presentada" : "Pendiente",
  }));
  const table = addTable(ws, {
    startRow: 4,
    columns: [
      { key: "obligation", header: "Obligación", kind: "text", width: 40 },
      { key: "period", header: "Período", kind: "text", width: 16 },
      { key: "due", header: "Vencimiento", kind: "date", width: 13 },
      {
        key: "left",
        header: "Días restantes",
        kind: "formula",
        resultKind: "integer",
        width: 11,
        align: "center",
        formula: (r) => `IF(${r.c("due")}="","",${r.c("due")}-TODAY())`,
      },
      {
        key: "status",
        header: "Estado",
        kind: "list",
        width: 13,
        list: ["Pendiente", "Presentada", "Pagada", "No aplica"],
      },
      { key: "filed", header: "Fecha de presentación", kind: "date", width: 14 },
      { key: "receipt", header: "N.º de constancia", kind: "text", width: 20 },
      { key: "note", header: "Notas", kind: "text", width: 26 },
    ],
    rows: predefined + config.extraRows,
    theme,
    ctx,
    example,
    autoFilter: true,
  });
  rows.forEach((r, i) => {
    const cell = ws.getCell(table.cell("due", table.firstRow + i));
    cell.value = { formula: r.due };
    cell.protection = { locked: true };
  });
  const d = table.letter("left");
  const s = table.letter("status");
  const f = table.firstRow;
  const area = `A${f}:H${table.lastRow}`;
  highlightWhen(
    ws,
    area,
    `AND($${d}${f}<>"",$${d}${f}<0,$${s}${f}="Pendiente")`,
    { fill: theme.dangerSoft, color: theme.danger },
    1,
  );
  highlightWhen(
    ws,
    area,
    `AND($${d}${f}<>"",$${d}${f}>=0,$${d}${f}<=7,$${s}${f}="Pendiente")`,
    { fill: theme.warningSoft },
    2,
  );
  highlightWhen(
    ws,
    area,
    `OR($${s}${f}="Presentada",$${s}${f}="Pagada")`,
    { color: theme.muted },
    3,
  );
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Calendario tributario",
    description:
      "Ten a la vista todas tus fechas de vencimiento del año y el estado de cada obligación.",
    steps: [
      "Las fechas de vencimiento se calculan con los días de la hoja Parámetros.",
      "Cambia el estado a Presentada o Pagada y anota la fecha y el número de constancia.",
      "Las obligaciones vencidas y pendientes se marcan en rojo; las que vencen en 7 días o menos, en ámbar.",
      "Agrega en las filas libres tus obligaciones municipales, del IHSS, del RAP u otras.",
    ],
    tips: [
      "Verifica los feriados nacionales y prórrogas que publique el SAR: pueden mover las fechas.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
