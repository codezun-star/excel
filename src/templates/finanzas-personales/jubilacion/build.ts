import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import type { TemplateBuild } from "@/templates/types";

import type { JubilacionConfig } from "./form";

export const build: TemplateBuild<JubilacionConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const title = "Plan de jubilación";
  const wb = createWorkbook({ title, ctx, options });
  const ws = addSheet(wb, "Proyección", { freezeRows: 15, tabColor: theme.primary });
  const years = Math.max(1, config.retireAge - config.age);

  addSheetHeader(ws, {
    title,
    subtitle: "Cambia los datos y mira cómo crece tu ahorro hasta el retiro.",
    theme,
    width: 8,
  });
  const f = addFields(ws, {
    startRow: 3,
    labelCol: 1,
    valueCol: 3,
    labelSpan: 2,
    fields: [
      { key: "age", label: "Edad actual", kind: "integer", value: config.age },
      { key: "retire", label: "Edad de retiro", kind: "integer", value: config.retireAge },
      {
        key: "retireYears",
        label: "Años de retiro a cubrir",
        kind: "integer",
        value: config.retireYears,
      },
      { key: "savings", label: "Ahorro actual", kind: "currency", value: config.savings },
      { key: "monthly", label: "Aporte mensual", kind: "currency", value: config.monthly },
      {
        key: "inc",
        label: "Aumento anual del aporte",
        kind: "percent",
        value: config.increase / 100,
      },
      { key: "ret", label: "Rendimiento anual", kind: "percent", value: config.returnRate / 100 },
      { key: "infl", label: "Inflación anual", kind: "percent", value: config.inflation / 100 },
    ],
    theme,
    ctx,
  });
  const c = f.cell;
  const table = addTable(ws, {
    startRow: 15,
    columns: [
      {
        key: "age",
        header: "Edad",
        kind: "formula",
        resultKind: "integer",
        width: 8,
        align: "center",
        formula: (r) => `IF(${c("age")}+${r.index}>=${c("retire")},"",${c("age")}+${r.index})`,
      },
      {
        key: "start",
        header: "Saldo al inicio",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) =>
          r.prev("end")
            ? `IF(${r.c("age")}="","",${r.prev("end")})`
            : `IF(${r.c("age")}="","",${c("savings")})`,
      },
      {
        key: "contrib",
        header: "Aportes del año",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("age")}="","",ROUND(${c("monthly")}*12*(1+${c("inc")})^${r.index},2))`,
      },
      {
        key: "gain",
        header: "Rendimiento",
        kind: "formula",
        resultKind: "currency",
        width: 14,
        total: "sum",
        formula: (r) =>
          `IF(${r.c("age")}="","",ROUND(${r.c("start")}*${c("ret")}+${r.c("contrib")}*${c("ret")}/2,2))`,
      },
      {
        key: "end",
        header: "Saldo al final",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) => `IF(${r.c("age")}="","",${r.c("start")}+${r.c("contrib")}+${r.c("gain")})`,
      },
      {
        key: "real",
        header: "En dinero de hoy",
        kind: "formula",
        resultKind: "currency",
        width: 15,
        formula: (r) =>
          `IF(${r.c("age")}="","",ROUND(${r.c("end")}/(1+${c("infl")})^(${r.index}+1),2))`,
      },
    ],
    rows: Math.max(years, 1) + 5,
    theme,
    ctx,
  });
  addFields(ws, {
    startRow: 3,
    labelCol: 5,
    valueCol: 6,
    title: "Al retirarte",
    fields: [
      {
        key: "final",
        label: "Ahorro acumulado",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `MAX(${table.range("end")})`,
      },
      {
        key: "real",
        label: "En dinero de hoy",
        kind: "calc",
        resultKind: "currency",
        formula: () => `MAX(${table.range("real")})`,
      },
      {
        key: "income",
        label: "Renta mensual posible",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) =>
          `IF(${c("ret")}=0,ROUND(${ref("final")}/(${c("retireYears")}*12),2),ROUND(PMT(${c("ret")}/12,${c("retireYears")}*12,-${ref("final")}),2))`,
      },
      {
        key: "incomeReal",
        label: "Renta mensual en dinero de hoy",
        kind: "calc",
        resultKind: "currency",
        formula: (ref) => `ROUND(${ref("income")}/(1+${c("infl")})^(${c("retire")}-${c("age")}),2)`,
      },
      {
        key: "contrib",
        label: "Total que aportarás",
        kind: "calc",
        resultKind: "currency",
        formula: () => `SUM(${table.range("contrib")})`,
      },
    ],
    theme,
    ctx,
  });
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Plan de jubilación",
    description: "Proyecta tu ahorro para el retiro y descubre cuánto ingreso mensual te daría.",
    steps: [
      "Escribe tu edad, la edad a la que te quieres retirar y cuántos años de retiro quieres cubrir.",
      "Escribe tu ahorro actual, tu aporte mensual y cuánto subirás el aporte cada año.",
      "Ajusta el rendimiento esperado y la inflación.",
      "Arriba a la derecha ves el ahorro al retirarte y la renta mensual que podrías retirar.",
    ],
    tips: [
      "La proyección no incluye la pensión del IHSS ni del RAP: súmala aparte si la tendrás.",
      "Usa un rendimiento conservador; los rendimientos pasados no garantizan los futuros.",
    ],
    ctx,
    theme,
    options,
  });
  setActiveSheet(wb, 0);
  return wb;
};
