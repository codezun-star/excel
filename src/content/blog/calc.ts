import type { CountryContext } from "@/countries";

/** Utilidades para que los ejemplos de los artículos usen las mismas reglas que las plantillas. */

export function fmtL(value: number): string {
  return `L ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

export function fmtNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function pct(rate: number): string {
  const value = Math.round(rate * 10000) / 100;
  return `${String(value)} %`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** DIAS360 método europeo (como DAYS360(a, b, 1) de Excel) + 1 día inclusivo. */
export function days360Inclusive(from: Date, to: Date): number {
  const d1 = Math.min(from.getUTCDate(), 30);
  const d2 = Math.min(to.getUTCDate(), 30);
  const days =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 360 +
    (to.getUTCMonth() - from.getUTCMonth()) * 30 +
    (d2 - d1);
  return Math.max(0, days + 1);
}

export function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function fmtDate(iso: string): string {
  return utc(iso).toLocaleDateString("es-HN", { dateStyle: "long", timeZone: "UTC" });
}

/** Proporcional de un décimo: salario × días / base. */
export function proportionalBonus(salary: number, days: number, ctx: CountryContext): number {
  return round2((salary * Math.min(days, ctx.labor.dayBasis)) / ctx.labor.dayBasis);
}

/** Deducciones del empleado: IHSS hasta el techo y RAP sobre el excedente. */
export function employeeSocialSecurity(salary: number, ctx: CountryContext) {
  return ctx.taxes.socialSecurity
    .filter((s) => s.employeeRate > 0)
    .map((s) => {
      const base =
        s.base === "aboveCeiling"
          ? Math.max(0, salary - (s.referenceCeiling ?? 0))
          : Math.min(salary, s.ceiling ?? salary);
      return { label: s.label, rate: s.employeeRate, base, amount: round2(base * s.employeeRate) };
    });
}

export function employerSocialSecurity(salary: number, ctx: CountryContext) {
  const ss = ctx.taxes.socialSecurity
    .filter((s) => s.employerRate > 0)
    .map((s) => {
      const base =
        s.base === "aboveCeiling"
          ? Math.max(0, salary - (s.referenceCeiling ?? 0))
          : Math.min(salary, s.ceiling ?? salary);
      return { label: s.label, rate: s.employerRate, amount: round2(base * s.employerRate) };
    });
  const only = ctx.taxes.employerOnly.map((e) => ({
    label: e.label,
    rate: e.rate,
    amount: round2(salary * e.rate),
  }));
  return [...ss, ...only];
}

/** ISR anual con la tabla progresiva del país. */
export function annualIncomeTax(taxable: number, ctx: CountryContext) {
  const rows = ctx.taxes.incomeTax.brackets.map((b) => {
    const upper = b.to ?? Infinity;
    const lower = b.from === 0 ? 0 : b.from - 0.01;
    const amountInBracket = Math.max(0, Math.min(taxable, upper) - lower);
    return {
      ...b,
      amountInBracket: round2(amountInBracket),
      tax: round2(amountInBracket * b.rate),
    };
  });
  return { rows, total: round2(rows.reduce((s, r) => s + r.tax, 0)) };
}

/** Cuota fija mensual (equivalente a PAGO / PMT de Excel). */
export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  if (r === 0) return round2(principal / months);
  return round2((principal * r) / (1 - Math.pow(1 + r, -months)));
}

/** Días de preaviso según meses de servicio (tabla del país, convertido a días). */
export function noticeDays(months: number, ctx: CountryContext): number {
  const row = [...ctx.labor.noticePeriod].reverse().find((r) => months >= r.fromMonths);
  if (!row) return 0;
  const factor = row.unit === "months" ? 30 : row.unit === "weeks" ? 7 : 1;
  return row.value * factor;
}

export function vacationDaysFor(serviceYear: number, ctx: CountryContext): number {
  const row = [...ctx.labor.vacationDays].reverse().find((r) => serviceYear >= r.fromYears);
  return row?.days ?? 0;
}

export function salesTaxRate(ctx: CountryContext, id: string): number {
  return ctx.taxes.salesTax.rates.find((r) => r.id === id)?.rate ?? 0;
}
