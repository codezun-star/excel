import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { highlightWhen } from "@/lib/excel/conditional";
import { FMT } from "@/lib/excel/formats";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addr, colLetter } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  styleCalc,
  styleHeader,
  styleInput,
  styleTotal,
} from "@/lib/excel/styles";
import { decimalBetween, listFromRange } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { HorariosConfig } from "./form";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const JORNADAS = ["Diurna", "Nocturna", "Mixta"];

export const build: TemplateBuild<HorariosConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const wb = createWorkbook({
    title: titleWith("Horarios y turnos", config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Horario", {
    freezeRows: 7,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const w = ctx.labor.workdays;
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [],
    tables: [
      {
        key: "jornadas",
        title: "Máximo de horas por jornada",
        columns: [
          { header: "Jornada", kind: "text" },
          { header: "Horas por día", kind: "number" },
          { header: "Horas por semana", kind: "number" },
        ],
        rows: [
          [JORNADAS[0]!, w.day.hoursPerDay, w.day.hoursPerWeek],
          [JORNADAS[1]!, w.night.hoursPerDay, w.night.hoursPerWeek],
          [JORNADAS[2]!, w.mixed.hoursPerDay, w.mixed.hoursPerWeek],
        ],
      },
    ],
  });

  addSheetHeader(ws, {
    title: titleWith("Horario semanal", config.businessName),
    subtitle: "Escribe la hora de entrada y salida (formato 24 h, por ejemplo 08:00 y 17:00).",
    theme,
    width: 20,
  });
  const top = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 2,
    fields: [
      { key: "week", label: "Semana del", kind: "date" },
      { key: "break", label: "Descanso por día (horas)", kind: "number", value: config.breakHours },
    ],
    theme,
    ctx,
  });

  const h1 = 6;
  const h2 = 7;
  const first = 8;
  const rows = config.employees.length + config.spareRows;
  const last = first + rows - 1;
  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 11;
  for (const [col, label] of [
    [1, "Empleado"],
    [2, "Jornada"],
  ] as const) {
    const c = ws.getCell(h1, col);
    c.value = label;
    styleHeader(c, theme);
    ws.mergeCells(h1, col, h2, col);
  }
  const inCol = (d: number) => 3 + d * 2;
  DAYS.forEach((day, d) => {
    ws.mergeCells(h1, inCol(d), h1, inCol(d) + 1);
    const c = ws.getCell(h1, inCol(d));
    c.value = day;
    styleHeader(c, theme);
    for (const [off, label] of [
      [0, "Entra"],
      [1, "Sale"],
    ] as const) {
      const s = ws.getCell(h2, inCol(d) + off);
      s.value = label;
      styleHeader(s, theme);
      ws.getColumn(inCol(d) + off).width = 7.5;
    }
  });
  const hoursCol = inCol(7);
  const maxCol = hoursCol + 1;
  const excessCol = hoursCol + 2;
  for (const [col, label] of [
    [hoursCol, "Horas netas"],
    [maxCol, "Máximo semanal"],
    [excessCol, "Exceso"],
  ] as const) {
    const c = ws.getCell(h1, col);
    c.value = label;
    styleHeader(c, theme);
    ws.mergeCells(h1, col, h2, col);
    ws.getColumn(col).width = 11;
  }

  const sample = (idx: number, d: number): [number, number] | null => {
    if (idx > 2) return null;
    if (idx === 0 && d < 5) return [8 / 24, 17 / 24];
    if (idx === 0 && d === 5) return [8 / 24, 12 / 24];
    if (idx === 1 && d < 6) return [14 / 24, 22 / 24];
    if (idx === 2 && d >= 1 && d <= 5) return [22 / 24, 4 / 24];
    return null;
  };

  for (let r = first; r <= last; r++) {
    const idx = r - first;
    const zebra = idx % 2 ? theme.zebra : "#FFFFFF";
    const name = ws.getCell(r, 1);
    name.value = config.employees[idx] ?? null;
    styleInput(name, theme, zebra);
    const shift = ws.getCell(r, 2);
    shift.value = config.example && idx === 2 ? JORNADAS[1]! : JORNADAS[0]!;
    styleInput(shift, theme, zebra);
    const parts: string[] = [];
    const ins: string[] = [];
    DAYS.forEach((_, d) => {
      const inCell = ws.getCell(r, inCol(d));
      const outCell = ws.getCell(r, inCol(d) + 1);
      for (const c of [inCell, outCell]) {
        styleInput(c, theme, zebra);
        c.numFmt = FMT.time;
        c.alignment = { horizontal: "center" };
      }
      const s = config.example ? sample(idx, d) : null;
      if (s) {
        inCell.value = s[0];
        outCell.value = s[1];
      }
      const a = addr(inCol(d), r);
      const b = addr(inCol(d) + 1, r);
      ins.push(a);
      parts.push(`IF(OR(${a}="",${b}=""),0,(IF(${b}<${a},${b}+1,${b})-${a})*24)`);
    });
    const hours = ws.getCell(r, hoursCol);
    hours.value = {
      formula: `IF($A${r}="","",MAX(0,${parts.join("+")}-${top.cell("break")}*COUNT(${ins.join(",")})))`,
    };
    styleCalc(hours, theme);
    hours.numFmt = FMT.hours;
    const max = ws.getCell(r, maxCol);
    max.value = {
      formula: `IF($A${r}="","",IFERROR(VLOOKUP($B${r},${params.table("jornadas")},3,0),""))`,
    };
    styleCalc(max, theme);
    const excess = ws.getCell(r, excessCol);
    excess.value = {
      formula: `IF(OR(${addr(hoursCol, r)}="",${addr(maxCol, r)}=""),"",MAX(0,${addr(hoursCol, r)}-${addr(maxCol, r)}))`,
    };
    styleTotal(excess, theme);
    excess.numFmt = FMT.hours;
  }
  listFromRange(ws, `B${first}:B${last}`, params.tableColumn("jornadas", 0));
  decimalBetween(
    ws,
    `${colLetter(inCol(0))}${first}:${colLetter(inCol(6) + 1)}${last}`,
    0,
    0.99999,
    "Escribe una hora válida, por ejemplo 08:00.",
  );
  const ex = `${colLetter(excessCol)}${first}`;
  highlightWhen(ws, `${ex}:${colLetter(excessCol)}${last}`, `AND(${ex}<>"",${ex}>0)`, {
    fill: theme.dangerSoft,
    color: theme.danger,
    bold: true,
  });
  ws.getCell(last + 2, 1).value =
    "Las horas que exceden el máximo semanal deben pagarse como horas extra.";
  ws.getCell(last + 2, 1).font = font(theme, { italic: true, size: 9, color: theme.muted });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Horarios y turnos",
    description: "Programa los turnos de la semana y controla que nadie exceda la jornada semanal.",
    steps: [
      "Escribe la fecha de inicio de la semana y las horas de descanso por día.",
      "Para cada empleado elige su jornada y escribe la hora de entrada y salida de cada día (deja vacío el día libre).",
      "Las horas netas se calculan restando el descanso; los turnos que pasan la medianoche se calculan bien.",
      "Si un empleado supera el máximo semanal de su jornada, la celda Exceso se marca en rojo.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
