import "server-only";

import { addSheetHeader } from "@/lib/excel/blocks";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import { makeTheme } from "@/lib/excel/styles";
import { addTable } from "@/lib/excel/table";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import {
  employerOnlySection,
  incomeTaxSection,
  incomeTaxTable,
  laborBaseSection,
  socialSecuritySection,
} from "@/templates/shared/labor";
import { titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import { EXAMPLE_EMPLOYEES } from "../shared/form";
import { addPayrollTable, employerColumns } from "../shared/payroll";
import type { PlanillaConfig } from "./form";

export const build: TemplateBuild<PlanillaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const period = periodLabel(config.month, config.year);
  const wb = createWorkbook({
    title: titleWith(`Planilla ${period}`, config.businessName),
    ctx,
    options,
  });
  const ws = addSheet(wb, "Planilla", {
    freezeRows: 4,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const employer = config.employerSheet
    ? addSheet(wb, "Aportes patronales", {
        freezeRows: 4,
        landscape: true,
        tabColor: theme.primary,
      })
    : null;
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [
      laborBaseSection(ctx),
      socialSecuritySection(ctx),
      employerOnlySection(ctx),
      incomeTaxSection(ctx),
    ],
    tables: [incomeTaxTable(ctx)],
  });

  addSheetHeader(ws, {
    title: titleWith("Planilla de sueldos", config.businessName),
    subtitle: `Período: ${period}${config.taxId ? ` · ${ctx.taxId.name} ${config.taxId}` : ""} · Montos en ${ctx.currency.code}`,
    theme,
    width: 12,
  });
  const payroll = addPayrollTable(ws, {
    startRow: 4,
    rows: config.rows,
    theme,
    ctx,
    params,
    socialSecurity: config.socialSecurity,
    includeIncomeTax: config.includeIncomeTax,
    biweekly: config.biweekly,
    example: config.example
      ? EXAMPLE_EMPLOYEES.map((e, i) => ({
          ...e,
          days: 30,
          overtime: i === 1 ? 850 : null,
          bonus: i === 0 ? 500 : null,
          other: i === 2 ? 1200 : null,
        }))
      : undefined,
  });

  if (employer) {
    addSheetHeader(employer, {
      title: "Aportes patronales y costo laboral",
      subtitle: `Período: ${period}. Calculado a partir de la hoja Planilla.`,
      theme,
      width: 8,
    });
    const t = payroll.table;
    const src = (key: string, index: number) =>
      sheetRef(ws.name, t.cell(key, t.firstRow + index, true));
    const patCols = employerColumns(ctx, params, config.socialSecurity);
    addTable(employer, {
      startRow: 4,
      columns: [
        {
          key: "name",
          header: "Empleado",
          kind: "formula",
          width: 26,
          formula: (r) => `IF(${src("name", r.index)}="","",${src("name", r.index)})`,
        },
        {
          key: "gross",
          header: "Total devengado",
          kind: "formula",
          resultKind: "currency",
          width: 15,
          total: "sum",
          formula: (r) => `IF(${src("gross", r.index)}="","",${src("gross", r.index)})`,
        },
        ...patCols,
        {
          key: "totalPat",
          header: "Total aportes patronales",
          kind: "formula",
          resultKind: "currency",
          width: 16,
          total: "sum",
          formula: (r) =>
            `IF(${r.c("gross")}="","",SUM(${patCols.map((c) => r.c(c.key)).join(",")}))`,
        },
        {
          key: "cost",
          header: "Costo laboral total",
          kind: "formula",
          resultKind: "currency",
          width: 16,
          total: "sum",
          formula: (r) => `IF(${r.c("gross")}="","",${r.c("gross")}+${r.c("totalPat")})`,
        },
      ],
      rows: config.rows,
      theme,
      ctx,
      totals: { label: "Totales" },
      headerHeight: 42,
    });
    await protectSheet(employer);
  }
  await protectSheet(ws);

  addInstructionsSheet(wb, {
    title: "Planilla de sueldos",
    description:
      "Calcula el salario devengado, las deducciones de ley y el neto a pagar de cada empleado, además del costo patronal.",
    steps: [
      "Revisa la hoja Parámetros: techos y porcentajes del IHSS y RAP, tabla del ISR y deducción médica. Están tomados de las reglas vigentes de Honduras.",
      "En la hoja Planilla escribe cada empleado con su salario mensual y los días laborados del período (30 = mes completo).",
      "Agrega horas extra, comisiones y otras deducciones si aplican.",
      "Las deducciones de IHSS, RAP e ISR, el total de deducciones y el neto se calculan solos.",
      "La hoja Aportes patronales muestra lo que paga la empresa y el costo laboral total.",
    ],
    sheets: [
      { name: "Planilla", description: "Ingresos, deducciones y neto por empleado." },
      ...(employer
        ? [
            {
              name: "Aportes patronales",
              description: "IHSS, RAP, INFOP y reserva laboral a cargo del patrono.",
            },
          ]
        : []),
      { name: "Parámetros", description: "Tasas, techos y tabla progresiva del ISR." },
    ],
    tips: [
      "La base de cotización usada es el total devengado del mes, limitado al techo correspondiente. Confirma con tu contador si tu caso requiere otra base.",
      "La retención de ISR se estima proyectando el salario mensual a un año; ajusta los meses proyectados en Parámetros si tu política incluye los décimos.",
      "Si un neto queda negativo, la celda se marca en rojo.",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
