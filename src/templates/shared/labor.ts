import type { CountryContext } from "@/countries";
import type { ParamRow, ParamSection, ParamTable } from "@/lib/excel/params";

/**
 * Parámetros laborales y de seguridad social tomados del módulo del país,
 * listos para la hoja "Parámetros". Las claves se usan en las fórmulas:
 *   ss:<id>:employee, ss:<id>:employer, ss:<id>:ceiling
 */

export function socialSecuritySection(ctx: CountryContext): ParamSection {
  const rows: ParamRow[] = [];
  for (const item of ctx.taxes.socialSecurity) {
    rows.push({
      key: `ss:${item.id}:employee`,
      label: `${item.label} — trabajador`,
      value: item.employeeRate,
      kind: "percent",
    });
    rows.push({
      key: `ss:${item.id}:employer`,
      label: `${item.label} — patrono`,
      value: item.employerRate,
      kind: "percent",
    });
    const ceiling = item.base === "aboveCeiling" ? item.referenceCeiling : item.ceiling;
    if (ceiling) {
      rows.push({
        key: `ss:${item.id}:ceiling`,
        label:
          item.base === "aboveCeiling"
            ? `${item.label} — se aplica sobre el excedente de`
            : `${item.label} — techo mensual`,
        value: ceiling,
        kind: "currency",
      });
    }
  }
  return { title: "Seguridad social", rows };
}

export function employerOnlySection(ctx: CountryContext): ParamSection {
  return {
    title: "Aportes solo patronales",
    rows: ctx.taxes.employerOnly.map((e) => ({
      key: `emp:${e.id}`,
      label: e.label,
      value: e.rate,
      kind: "percent" as const,
    })),
  };
}

export function incomeTaxTable(ctx: CountryContext): ParamTable {
  return {
    key: "isr",
    title: `Tabla progresiva ${ctx.taxes.incomeTax.name} ${ctx.taxes.incomeTax.fiscalYear} (renta neta anual)`,
    columns: [
      { header: "Desde", kind: "currency" },
      { header: "Hasta", kind: "currency" },
      { header: "Tasa", kind: "percent" },
    ],
    rows: ctx.taxes.incomeTax.brackets.map((b) => [b.from, b.to, b.rate]),
    note: "La última fila no tiene límite superior.",
  };
}

export function incomeTaxSection(ctx: CountryContext): ParamSection {
  return {
    title: `${ctx.taxes.incomeTax.name} — retención mensual`,
    rows: [
      ...ctx.taxes.incomeTax.standardDeductions.map((d) => ({
        key: `isr:ded:${d.id}`,
        label: `Deducción anual: ${d.label}`,
        value: d.amount,
        kind: "currency" as const,
      })),
      {
        key: "isr:months",
        label: "Meses de salario proyectados al año",
        value: ctx.taxes.incomeTax.withholding.projectionMonths,
        kind: "integer" as const,
      },
    ],
  };
}

export function laborBaseSection(ctx: CountryContext): ParamSection {
  return {
    title: "Bases de cálculo",
    rows: [
      {
        key: "days:month",
        label: "Días por mes (base comercial)",
        value: ctx.labor.dayBasis / 12,
        kind: "integer",
      },
      {
        key: "days:year",
        label: "Días por año (base para proporcionales)",
        value: ctx.labor.dayBasis,
        kind: "integer",
      },
      {
        key: "hours:day",
        label: "Horas de la jornada diurna",
        value: ctx.labor.workdays.day.hoursPerDay,
        kind: "integer",
      },
    ],
  };
}

/**
 * Fórmula del impuesto anual por tramos progresivos. `income` es la celda de
 * renta neta gravable; los límites y tasas se leen de la tabla de parámetros
 * (columna 0 = desde, 1 = hasta, 2 = tasa). Sin SUMPRODUCT ni fórmulas
 * matriciales para que funcione igual en Excel 2010 y Google Sheets.
 */
export function progressiveTaxFormula(
  income: string,
  ctx: CountryContext,
  tableCell: (row: number, col: number) => string,
): string {
  const n = ctx.taxes.incomeTax.brackets.length;
  const terms: string[] = [];
  for (let i = 0; i < n; i++) {
    const lower = i === 0 ? "0" : tableCell(i - 1, 1);
    const rate = tableCell(i, 2);
    const isLast = i === n - 1;
    const upper = tableCell(i, 1);
    const taxable = isLast
      ? `MAX(0,${income}-${lower})`
      : `MAX(0,MIN(${income},${upper})-${lower})`;
    terms.push(`${taxable}*${rate}`);
  }
  return terms.join("+");
}
