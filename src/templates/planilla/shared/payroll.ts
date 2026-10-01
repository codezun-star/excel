import type ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";
import { highlightWhen } from "@/lib/excel/conditional";
import type { ParamsRef } from "@/lib/excel/params";
import type { SheetTheme } from "@/lib/excel/styles";
import { addTable, type CellInput, type ColumnDef, type TableRef } from "@/lib/excel/table";
import { progressiveTaxFormula } from "@/templates/shared/labor";

/**
 * Tabla de planilla mensual con deducciones de seguridad social (según los
 * regímenes definidos en el país), ISR y otras deducciones. La comparten la
 * planilla de sueldos y las boletas de pago.
 */
export interface PayrollOptions {
  startRow: number;
  rows: number;
  theme: SheetTheme;
  ctx: CountryContext;
  params: ParamsRef;
  /** Ids de los regímenes de seguridad social a descontar */
  socialSecurity: string[];
  includeIncomeTax: boolean;
  biweekly: boolean;
  example?: Array<Record<string, CellInput>>;
}

export interface PayrollRef {
  table: TableRef;
  /** Claves de las columnas de deducción de seguridad social (trabajador) */
  ssKeys: { id: string; key: string; label: string }[];
  hasIncomeTax: boolean;
}

export function employeeSocialSecurity(ctx: CountryContext, selected: string[]) {
  return ctx.taxes.socialSecurity.filter((s) => selected.includes(s.id) && s.employeeRate > 0);
}

export function addPayrollTable(ws: ExcelJS.Worksheet, opts: PayrollOptions): PayrollRef {
  const { ctx, params } = opts;
  const p = params.ref;
  const ssItems = employeeSocialSecurity(ctx, opts.socialSecurity);
  const ssKeys = ssItems.map((s) => ({ id: s.id, key: `ss_${s.id}`, label: s.label }));

  const contribution = (
    item: (typeof ssItems)[number],
    gross: string,
    side: "employee" | "employer",
  ) => {
    const rate = p(`ss:${item.id}:${side}`);
    if (item.base === "aboveCeiling")
      return `ROUND(MAX(0,${gross}-${p(`ss:${item.id}:ceiling`)})*${rate},2)`;
    if (item.base === "upToCeiling" && item.ceiling)
      return `ROUND(MIN(${gross},${p(`ss:${item.id}:ceiling`)})*${rate},2)`;
    return `ROUND(${gross}*${rate},2)`;
  };

  const deductionKeys: string[] = [...ssKeys.map((s) => s.key)];
  const columns: ColumnDef[] = [
    {
      key: "n",
      header: "N.º",
      kind: "formula",
      width: 5,
      align: "center",
      resultKind: "integer",
      formula: (r) => `IF(${r.c("name")}="","",${r.index + 1})`,
    },
    { key: "name", header: "Empleado", kind: "text", width: 26 },
    { key: "dni", header: ctx.taxId.personalIdName, kind: "text", width: 16 },
    { key: "position", header: "Cargo", kind: "text", width: 18 },
    { key: "salary", header: "Salario mensual", kind: "currency", width: 15 },
    {
      key: "days",
      header: "Días laborados",
      kind: "number",
      width: 10,
      align: "center",
      fill: ctx.labor.dayBasis / 12,
    },
    {
      key: "earned",
      header: "Salario devengado",
      kind: "formula",
      resultKind: "currency",
      width: 15,
      total: "sum",
      formula: (r) =>
        `IF(OR(${r.c("salary")}="",${r.c("days")}=""),"",ROUND(${r.c("salary")}/${p("days:month")}*${r.c("days")},2))`,
    },
    { key: "overtime", header: "Horas extra", kind: "currency", width: 13, total: "sum" },
    { key: "bonus", header: "Comisiones y bonos", kind: "currency", width: 14, total: "sum" },
    {
      key: "gross",
      header: "Total devengado",
      kind: "formula",
      resultKind: "currency",
      width: 15,
      total: "sum",
      formula: (r) =>
        `IF(${r.c("earned")}="","",${r.c("earned")}+${r.c("overtime")}+${r.c("bonus")})`,
    },
    ...ssItems.map((item): ColumnDef => ({
      key: `ss_${item.id}`,
      header: item.label.replace("IHSS ", "IHSS\n"),
      kind: "formula",
      resultKind: "currency",
      width: 13,
      total: "sum",
      wrap: true,
      formula: (r) => `IF(${r.c("gross")}="","",${contribution(item, r.c("gross"), "employee")})`,
    })),
  ];

  if (opts.includeIncomeTax) {
    const deductions = ctx.taxes.incomeTax.standardDeductions.map((d) => p(`isr:ded:${d.id}`));
    columns.push({
      key: "annual",
      header: "Renta neta anual estimada",
      kind: "formula",
      resultKind: "currency",
      width: 16,
      note: "Salario mensual × meses proyectados − deducciones anuales (hoja Parámetros).",
      formula: (r) =>
        `IF(${r.c("salary")}="","",MAX(0,${r.c("salary")}*${p("isr:months")}${deductions.map((d) => `-${d}`).join("")}))`,
    });
    columns.push({
      key: "isr",
      header: `Retención ${ctx.taxes.incomeTax.name}`,
      kind: "formula",
      resultKind: "currency",
      width: 13,
      total: "sum",
      formula: (r) =>
        `IF(${r.c("annual")}="","",ROUND((${progressiveTaxFormula(r.c("annual"), ctx, (row, col) => params.tableCell("isr", row, col))})/12,2))`,
    });
    deductionKeys.push("isr");
  }

  columns.push(
    {
      key: "other",
      header: "Otras deducciones",
      kind: "currency",
      width: 13,
      total: "sum",
      note: "Préstamos, adelantos, cooperativa, etc.",
    },
    {
      key: "deductions",
      header: "Total deducciones",
      kind: "formula",
      resultKind: "currency",
      width: 14,
      total: "sum",
      formula: (r) =>
        `IF(${r.c("gross")}="","",SUM(${[...deductionKeys, "other"].map((k) => r.c(k)).join(",")}))`,
    },
    {
      key: "net",
      header: "Neto a pagar",
      kind: "formula",
      resultKind: "currency",
      width: 15,
      total: "sum",
      formula: (r) => `IF(${r.c("gross")}="","",${r.c("gross")}-${r.c("deductions")})`,
    },
  );
  if (opts.biweekly) {
    columns.push({
      key: "half",
      header: "Pago por quincena",
      kind: "formula",
      resultKind: "currency",
      width: 14,
      total: "sum",
      formula: (r) => `IF(${r.c("net")}="","",ROUND(${r.c("net")}/2,2))`,
    });
  }

  const table = addTable(ws, {
    startRow: opts.startRow,
    columns,
    rows: opts.rows,
    theme: opts.theme,
    ctx,
    totals: { label: "Totales" },
    example: opts.example,
    headerHeight: 42,
  });
  // Alerta si el neto queda negativo
  const netCol = table.letter("net");
  highlightWhen(
    ws,
    `${netCol}${table.firstRow}:${netCol}${table.lastRow}`,
    `AND(${netCol}${table.firstRow}<>"",${netCol}${table.firstRow}<0)`,
    {
      fill: opts.theme.dangerSoft,
      color: opts.theme.danger,
      bold: true,
    },
  );
  return { table, ssKeys, hasIncomeTax: opts.includeIncomeTax };
}

/** Columnas de aportes patronales calculadas a partir de la planilla. */
export function employerColumns(
  ctx: CountryContext,
  params: ParamsRef,
  selected: string[],
): ColumnDef[] {
  const p = params.ref;
  const items = ctx.taxes.socialSecurity.filter(
    (s) => selected.includes(s.id) && s.employerRate > 0,
  );
  const cols: ColumnDef[] = items.map((item) => ({
    key: `pat_${item.id}`,
    header: `${item.label} (patrono)`,
    kind: "formula",
    resultKind: "currency",
    width: 14,
    total: "sum",
    wrap: true,
    formula: (r) => {
      const g = r.c("gross");
      const rate = p(`ss:${item.id}:employer`);
      const calc =
        item.base === "aboveCeiling"
          ? `ROUND(MAX(0,${g}-${p(`ss:${item.id}:ceiling`)})*${rate},2)`
          : item.ceiling
            ? `ROUND(MIN(${g},${p(`ss:${item.id}:ceiling`)})*${rate},2)`
            : `ROUND(${g}*${rate},2)`;
      return `IF(${g}="","",${calc})`;
    },
  }));
  for (const e of ctx.taxes.employerOnly) {
    cols.push({
      key: `emp_${e.id}`,
      header: e.label,
      kind: "formula",
      resultKind: "currency",
      width: 14,
      total: "sum",
      wrap: true,
      formula: (r) => `IF(${r.c("gross")}="","",ROUND(${r.c("gross")}*${p(`emp:${e.id}`)},2))`,
    });
  }
  return cols;
}
