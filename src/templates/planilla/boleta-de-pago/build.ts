import "server-only";

import { amountInWordsRef } from "@/lib/excel/amount-in-words";
import { addSheetHeader } from "@/lib/excel/blocks";
import { FMT, currencyFormat } from "@/lib/excel/formats";
import { addInstructionsSheet } from "@/lib/excel/instructions";
import { addParametersSheet } from "@/lib/excel/params";
import { absAddr, sheetRef } from "@/lib/excel/refs";
import { addSheet, protectSheet } from "@/lib/excel/sheet";
import {
  font,
  makeTheme,
  solidFill,
  styleCalc,
  styleHeader,
  styleInput,
  styleLabel,
  styleTotal,
  toArgb,
} from "@/lib/excel/styles";
import { dateValidation } from "@/lib/excel/validation";
import { DEFAULT_BUILD_OPTIONS, createWorkbook, setActiveSheet } from "@/lib/excel/workbook";
import {
  incomeTaxSection,
  incomeTaxTable,
  laborBaseSection,
  socialSecuritySection,
} from "@/templates/shared/labor";
import { titleWith } from "@/templates/shared/ledger-form";
import { periodLabel } from "@/templates/shared/period";
import type { TemplateBuild } from "@/templates/types";

import { EXAMPLE_EMPLOYEES } from "../shared/form";
import { addPayrollTable } from "../shared/payroll";
import type { BoletaConfig } from "./form";

export const build: TemplateBuild<BoletaConfig> = async (
  config,
  ctx,
  options = DEFAULT_BUILD_OPTIONS,
) => {
  const theme = makeTheme(config.color);
  const period = periodLabel(config.month, config.year);
  const wb = createWorkbook({
    title: titleWith(`Boletas de pago ${period}`, config.businessName),
    ctx,
    options,
  });
  const slips = addSheet(wb, "Boletas", { showGridLines: false, tabColor: theme.primary });
  const data = addSheet(wb, "Datos", {
    freezeRows: 4,
    freezeCols: 2,
    landscape: true,
    tabColor: theme.primary,
  });
  const params = addParametersSheet(wb, {
    ctx,
    theme,
    sections: [laborBaseSection(ctx), socialSecuritySection(ctx), incomeTaxSection(ctx)],
    tables: [incomeTaxTable(ctx)],
  });

  addSheetHeader(data, {
    title: "Datos de planilla",
    subtitle: `Período: ${period}. Las boletas se llenan con estos datos.`,
    theme,
    width: 12,
  });
  const payroll = addPayrollTable(data, {
    startRow: 4,
    rows: config.rows,
    theme,
    ctx,
    params,
    socialSecurity: config.socialSecurity,
    includeIncomeTax: config.includeIncomeTax,
    biweekly: false,
    example: config.example
      ? EXAMPLE_EMPLOYEES.slice(0, Math.min(config.rows, 4)).map((e, i) => ({
          ...e,
          days: 30,
          overtime: i === 1 ? 850 : null,
        }))
      : undefined,
  });
  const t = payroll.table;
  const src = (key: string, i: number) => sheetRef(data.name, t.cell(key, t.firstRow + i, true));

  [22, 16, 4, 26, 16].forEach((w, i) => (slips.getColumn(i + 1).width = w));
  const deductions: { label: string; key: string }[] = [
    ...payroll.ssKeys.map((s) => ({ label: s.label, key: s.key })),
    ...(payroll.hasIncomeTax
      ? [{ label: `Retención ${ctx.taxes.incomeTax.name}`, key: "isr" }]
      : []),
    { label: "Otras deducciones", key: "other" },
  ];
  const incomes = [
    { label: "Salario devengado", key: "earned" },
    { label: "Horas extra", key: "overtime" },
    { label: "Comisiones y bonos", key: "bonus" },
  ];
  const lines = Math.max(incomes.length, deductions.length);
  const block = 9 + lines;

  for (let i = 0; i < config.rows; i++) {
    const b = 1 + i * block;
    slips.mergeCells(b, 1, b, 2);
    const name = slips.getCell(b, 1);
    name.value = config.businessName || "Nombre de la empresa";
    name.font = font(theme, { bold: true, size: 13, color: theme.primaryDark });
    slips.mergeCells(b, 4, b, 5);
    const band = slips.getCell(b, 4);
    band.value = "BOLETA DE PAGO";
    band.font = font(theme, { bold: true, color: theme.onPrimary });
    band.fill = solidFill(theme.primary);
    band.alignment = { horizontal: "center", vertical: "middle" };

    const pair = (
      row: number,
      l1: string,
      v1: { formula: string } | string | null,
      l2: string,
      v2: { formula: string } | string | null,
    ) => {
      const a = slips.getCell(row, 1);
      a.value = l1;
      styleLabel(a, theme);
      const av = slips.getCell(row, 2);
      av.value = v1;
      styleCalc(av, theme);
      const c = slips.getCell(row, 4);
      c.value = l2;
      styleLabel(c, theme);
      const cv = slips.getCell(row, 5);
      cv.value = v2;
      styleCalc(cv, theme);
      return { av, cv };
    };
    pair(
      b + 1,
      "Empleado",
      { formula: `IF(${src("name", i)}="","",${src("name", i)})` },
      ctx.taxId.personalIdName,
      { formula: `IF(${src("dni", i)}="","",${src("dni", i)})` },
    );
    pair(
      b + 2,
      "Cargo",
      { formula: `IF(${src("position", i)}="","",${src("position", i)})` },
      "Días laborados",
      { formula: `IF(${src("days", i)}="","",${src("days", i)})` },
    );
    const { cv: dateCell } = pair(b + 3, "Período", period, "Fecha de pago", null);
    styleInput(dateCell, theme);
    dateCell.numFmt = FMT.date;
    dateValidation(slips, dateCell.address);

    const hr = b + 4;
    for (const [col, label] of [
      [1, "Ingresos"],
      [2, "Monto"],
      [4, "Deducciones"],
      [5, "Monto"],
    ] as const) {
      const c = slips.getCell(hr, col);
      c.value = label;
      styleHeader(c, theme);
    }
    for (let j = 0; j < lines; j++) {
      const r = hr + 1 + j;
      const inc = incomes[j];
      if (inc) {
        slips.getCell(r, 1).value = inc.label;
        const v = slips.getCell(r, 2);
        v.value = { formula: `N(${src(inc.key, i)})` };
        styleCalc(v, theme);
        v.numFmt = currencyFormat(ctx);
      }
      const ded = deductions[j];
      if (ded) {
        slips.getCell(r, 4).value = ded.label;
        slips.getCell(r, 4).font = font(theme, { size: 10 });
        const v = slips.getCell(r, 5);
        v.value = { formula: `N(${src(ded.key, i)})` };
        styleCalc(v, theme);
        v.numFmt = currencyFormat(ctx);
      }
    }
    const tr = hr + 1 + lines;
    const totals = pair(
      tr,
      "Total ingresos",
      { formula: `N(${src("gross", i)})` },
      "Total deducciones",
      { formula: `N(${src("deductions", i)})` },
    );
    styleTotal(totals.av, theme);
    styleTotal(totals.cv, theme);
    totals.av.numFmt = currencyFormat(ctx);
    totals.cv.numFmt = currencyFormat(ctx);
    const nr = tr + 1;
    slips.mergeCells(nr, 1, nr, 4);
    const netLabel = slips.getCell(nr, 1);
    netLabel.value = {
      formula: `"NETO A PAGAR — "&${amountInWordsRef(wb, sheetRef(slips.name, absAddr(5, nr)), ctx)}`,
    };
    netLabel.font = font(theme, { bold: true, size: 9 });
    netLabel.alignment = { wrapText: true, vertical: "middle" };
    slips.getRow(nr).height = 30;
    const net = slips.getCell(nr, 5);
    net.value = { formula: `N(${src("net", i)})` };
    styleTotal(net, theme);
    net.numFmt = currencyFormat(ctx);
    net.font = font(theme, { bold: true, size: 12 });
    const sr = nr + 2;
    const sign = slips.getCell(sr, 4);
    sign.value = "Recibí conforme (firma del empleado)";
    sign.border = { top: { style: "thin" } };
    sign.font = font(theme, { size: 9, color: theme.muted });
    slips.mergeCells(sr, 4, sr, 5);
    for (let col = 1; col <= 5; col++) {
      slips.getCell(sr + 1, col).border = {
        bottom: { style: "dashed", color: { argb: toArgb(theme.border) } },
      };
    }
    if ((i + 1) % 2 === 0 && i + 1 < config.rows) slips.getRow(sr + 1).addPageBreak();
  }
  await protectSheet(slips);
  await protectSheet(data);

  addInstructionsSheet(wb, {
    title: "Boletas de pago",
    description:
      "Genera el comprobante de pago de cada empleado a partir de los datos de planilla.",
    steps: [
      "En la hoja Datos escribe cada empleado con su salario, días laborados, horas extra, bonos y otras deducciones.",
      "Las deducciones de ley y el neto se calculan con los valores de la hoja Parámetros.",
      "La hoja Boletas se llena sola: escribe la fecha de pago, imprime (dos boletas por página) y recorta.",
      "Pide al empleado que firme su boleta como constancia de recibido.",
    ],
    ctx,
    theme,
    options,
    regulated: "laboral",
  });
  setActiveSheet(wb, 0);
  return wb;
};
