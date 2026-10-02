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

export interface LiquidationInput {
  start: string;
  end: string;
  /** Salario ordinario mensual (vacaciones y décimos) */
  salary: number;
  /** Salario promedio de los últimos 6 meses (preaviso y cesantía) */
  averageSalary: number;
  reasonId: string;
  /** Días de vacaciones ganadas y no gozadas de años anteriores */
  pendingVacationDays?: number;
}

/** Liquidación laboral con la misma lógica de la plantilla de prestaciones. */
export function computeLiquidation(input: LiquidationInput, ctx: CountryContext) {
  const basis = ctx.labor.dayBasis;
  const start = utc(input.start);
  const end = utc(input.end);
  const d360 = end < start ? 0 : days360Inclusive(start, end);
  const years = Math.floor(d360 / basis);
  const months = Math.floor(d360 / 30);
  const reason = ctx.labor.terminationReasons.find((r) => r.id === input.reasonId);
  const dailyAvg = input.averageSalary / 30;
  const dailyOrd = input.salary / 30;
  const nDays = reason?.notice ? noticeDays(months, ctx) : 0;
  const notice = round2(nDays * dailyAvg);
  const sev = ctx.labor.severance;
  let severance = 0;
  if (reason?.severance) {
    if (months < 12) {
      const row = [...sev.underOneYear].reverse().find((r) => months >= r.fromMonths);
      severance = round2((row?.value ?? 0) * dailyAvg);
    } else {
      severance = round2(
        Math.min(sev.maxMonths, (d360 / basis) * sev.monthsPerYear) * input.averageSalary,
      );
    }
  }
  const vacEntitled = vacationDaysFor(years + 1, ctx);
  const vacDays = ((d360 - years * basis) / basis) * vacEntitled;
  const vacation = round2(vacDays * dailyOrd);
  const vacationPending = round2((input.pendingVacationDays ?? 0) * dailyOrd);
  const y = end.getUTCFullYear();
  const t = ctx.labor.thirteenthMonth.periodStart;
  const f = ctx.labor.fourteenthMonth.periodStart;
  const start13 = new Date(Date.UTC(y, t.month - 1, t.day));
  let start14 = new Date(Date.UTC(y, f.month - 1, f.day));
  if (end < start14) start14 = new Date(Date.UTC(y - 1, f.month - 1, f.day));
  const from13 = start > start13 ? start : start13;
  const from14 = start > start14 ? start : start14;
  const d13 =
    end < from13 ? 0 : proportionalBonus(input.salary, days360Inclusive(from13, end), ctx);
  const d14 =
    end < from14 ? 0 : proportionalBonus(input.salary, days360Inclusive(from14, end), ctx);
  const total = round2(notice + severance + vacation + vacationPending + d13 + d14);
  return {
    d360,
    years,
    months,
    reason,
    noticeDays: nDays,
    notice,
    severance,
    vacationDays: round2(vacDays),
    vacation,
    vacationPending,
    d13,
    d14,
    total,
  };
}

/** Separa o agrega el ISV a un monto. */
export function salesTaxBreakdown(amount: number, rate: number, included: boolean) {
  const subtotal = included ? round2(amount / (1 + rate)) : round2(amount);
  const tax = included ? round2(amount - subtotal) : round2(amount * rate);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

/** Tabla de amortización con cuota nivelada. */
export function amortizationSchedule(principal: number, annualRate: number, months: number) {
  const payment = monthlyPayment(principal, annualRate, months);
  const r = annualRate / 12;
  let balance = principal;
  const rows: { n: number; payment: number; interest: number; capital: number; balance: number }[] =
    [];
  for (let n = 1; n <= months; n++) {
    const interest = round2(balance * r);
    const pay = n === months ? round2(balance + interest) : payment;
    const capital = round2(pay - interest);
    balance = round2(balance - capital);
    rows.push({ n, payment: pay, interest, capital, balance: Math.max(0, balance) });
  }
  return { payment, rows, totalInterest: round2(rows.reduce((s, x) => s + x.interest, 0)) };
}
