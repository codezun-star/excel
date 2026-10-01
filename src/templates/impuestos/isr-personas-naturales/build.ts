import "server-only";

import { addFields, addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import { incomeTaxSection, incomeTaxTable, progressiveTaxFormula } from "@/templates/shared/labor";
import { titleWith } from "@/templates/shared/ledger-form";
import type { TemplateBuild } from "@/templates/types";

import type { IsrConfig } from "./form";

export const build: TemplateBuild<IsrConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const it = ctx.taxes.incomeTax;
  const wb = createWorkbook({
    title: titleWith(`${it.name} ${it.fiscalYear}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, `Cálculo ${it.name}`, { showGridLines: false, tabColor: theme.primary });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [incomeTaxSection(ctx)],
    tables: [incomeTaxTable(ctx)],
  });
  const cell = (r: number, c: number) => params.tableCell("isr", r, c);
  const ex = config.example;
  ws.getColumn(1).width = 2;
  ws.getColumn(2).width = 48;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 3;

  addSheetHeader(ws, {
    title: `${it.name} anual — personas naturales (${it.fiscalYear})`,
    subtitle: `${config.businessName || "Contribuyente"} · Declaración anual: vence el ${it.annualFilingDeadline} del año siguiente.`,
    theme,
    width: 6,
    startCol: 2,
  });
  const income = addFields(ws, {
    startRow: 4,
    labelCol: 2,
    valueCol: 3,
    title: "1. Ingresos del año",
    fields: [
      { key: "salary", label: "Salarios y sueldos", kind: "currency", value: ex ? 480_000 : 0 },
      {
        key: "d13",
        label: `${ctx.labor.thirteenthMonth.label}`,
        kind: "currency",
        value: ex ? 40_000 : 0,
      },
      {
        key: "d14",
        label: `${ctx.labor.fourteenthMonth.label}`,
        kind: "currency",
        value: ex ? 40_000 : 0,
      },
      {
        key: "fees",
        label: "Honorarios y servicios profesionales",
        kind: "currency",
        value: ex ? 60_000 : 0,
      },
      { key: "other", label: "Otros ingresos gravables", kind: "currency", value: 0 },
      {
        key: "gross",
        label: "Total de ingresos",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => ["salary", "d13", "d14", "fees", "other"].map((k) => r(k)).join("+"),
      },
    ],
    theme,
    ctx,
  });
  const ded = addFields(ws, {
    startRow: income.nextRow + 1,
    labelCol: 2,
    valueCol: 3,
    title: "2. Ingresos no gravables y deducciones",
    fields: [
      {
        key: "exempt",
        label: "Ingresos no gravables o exentos (según ley)",
        kind: "currency",
        value: ex ? 40_000 : 0,
        note: "Confirma con tu contador qué ingresos son exentos en tu caso.",
      },
      ...it.standardDeductions.map((d) => ({
        key: `std_${d.id}`,
        label: d.label,
        kind: "calc" as const,
        resultKind: "currency" as const,
        formula: () => params.ref(`isr:ded:${d.id}`),
      })),
      { key: "otherDed", label: "Otras deducciones permitidas", kind: "currency", value: 0 },
      {
        key: "taxable",
        label: "Renta neta gravable",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) =>
          `MAX(0,${income.cell("gross")}-${r("exempt")}${it.standardDeductions.map((d) => `-${r(`std_${d.id}`)}`).join("")}-${r("otherDed")})`,
      },
    ],
    theme,
    ctx,
  });
  const taxable = ded.cell("taxable");
  const res = addFields(ws, {
    startRow: ded.nextRow + 1,
    labelCol: 2,
    valueCol: 3,
    title: "3. Impuesto",
    fields: [
      {
        key: "tax",
        label: "Impuesto anual según tabla progresiva",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: () => `ROUND(${progressiveTaxFormula(taxable, ctx, cell)},2)`,
      },
      {
        key: "effective",
        label: "Tasa efectiva sobre ingresos",
        kind: "calc",
        resultKind: "percent",
        formula: (r) => `IFERROR(${r("tax")}/${income.cell("gross")},0)`,
      },
      {
        key: "monthly",
        label: "Retención mensual sugerida (÷ 12)",
        kind: "calc",
        resultKind: "currency",
        formula: (r) => `ROUND(${r("tax")}/12,2)`,
      },
      {
        key: "withheld",
        label: "Retenciones efectuadas en el año",
        kind: "currency",
        value: ex ? 3_500 : 0,
      },
      {
        key: "toPay",
        label: "IMPUESTO A PAGAR",
        kind: "calc",
        resultKind: "currency",
        emphasis: true,
        formula: (r) => `MAX(0,${r("tax")}-${r("withheld")})`,
      },
      {
        key: "refund",
        label: "Saldo a favor",
        kind: "calc",
        resultKind: "currency",
        formula: (r) => `MAX(0,${r("withheld")}-${r("tax")})`,
      },
    ],
    theme,
    ctx,
  });

  // Desglose por tramo
  addTable(ws, {
    startRow: res.nextRow + 1,
    startCol: 2,
    columns: [
      {
        key: "bracket",
        header: "Tramo",
        kind: "formula",
        width: 48,
        formula: (r) =>
          `TEXT(${cell(r.index, 0)},"#,##0.00")&IF(${cell(r.index, 1)}="",""," a "&TEXT(${cell(r.index, 1)},"#,##0.00"))`,
      },
      {
        key: "rate",
        header: "Tasa",
        kind: "formula",
        resultKind: "percent",
        width: 20,
        formula: (r) => cell(r.index, 2),
      },
      {
        key: "base",
        header: "Renta en el tramo",
        kind: "formula",
        resultKind: "currency",
        width: 18,
        total: "sum",
        formula: (r) => {
          const lower = r.index === 0 ? "0" : cell(r.index - 1, 1);
          const isLast = r.index === it.brackets.length - 1;
          return isLast
            ? `MAX(0,${taxable}-${lower})`
            : `MAX(0,MIN(${taxable},${cell(r.index, 1)})-${lower})`;
        },
      },
      {
        key: "tax",
        header: "Impuesto del tramo",
        kind: "formula",
        resultKind: "currency",
        width: 18,
        total: "sum",
        formula: (r) => `ROUND(${r.c("base")}*${r.c("rate")},2)`,
      },
    ],
    rows: it.brackets.length,
    theme,
    ctx,
    totals: { label: "Total" },
  });
  ws.getColumn(5).width = 18;
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: `${it.name} de personas naturales`,
    description: `Estima tu ${it.name} anual con la tabla progresiva ${it.fiscalYear} y compáralo con las retenciones del año.`,
    steps: [
      "Escribe tus ingresos del año por tipo.",
      "Indica los ingresos no gravables o exentos y otras deducciones que te correspondan; la deducción estándar se toma de Parámetros.",
      "El impuesto anual, la tasa efectiva y el desglose por tramo se calculan solos.",
      "Escribe las retenciones que te hicieron para saber si debes pagar o tienes saldo a favor.",
    ],
    ctx,
    theme,
    options,
    regulated: "fiscal",
  });
  setActiveSheet(wb, 0);
  return wb;
};
