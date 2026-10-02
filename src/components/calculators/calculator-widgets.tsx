"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  amortizationSchedule,
  annualIncomeTax,
  computeLiquidation,
  days360Inclusive,
  fmtL,
  pct,
  proportionalBonus,
  round2,
  salesTaxBreakdown,
  utc,
} from "@/content/blog/calc";
import { HN } from "@/countries/hn";

const ctx = HN;

function num(value: string): number {
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(utc(value).getTime());
}

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        L
      </span>
      <Input
        id={id}
        inputMode="decimal"
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-7 tabular-nums"
      />
    </div>
  );
}

export interface ResultData {
  title: string;
  rows: [string, string][];
  total: [string, string];
  note?: string;
  extra?: ReactNode;
}

function Layout({ form, result }: { form: ReactNode; result: ResultData | null }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form
        className="grid content-start gap-4 rounded-2xl border bg-card p-5 sm:p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        {form}
      </form>
      <div aria-live="polite" className="min-w-0">
        {result ? (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <p className="border-b bg-muted/50 px-5 py-3 font-semibold">{result.title}</p>
            <dl className="divide-y text-sm">
              {result.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-5 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 bg-brand px-5 py-4 text-white">
                <dt className="font-semibold">{result.total[0]}</dt>
                <dd className="font-heading text-2xl font-extrabold tabular-nums">
                  {result.total[1]}
                </dd>
              </div>
            </dl>
            {result.note && (
              <p className="px-5 py-3 text-xs text-muted-foreground">{result.note}</p>
            )}
            {result.extra}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Completa los datos para ver el resultado.
          </p>
        )}
      </div>
    </div>
  );
}

function BonusCalculator({ kind }: { kind: "13" | "14" }) {
  const isFourteen = kind === "14";
  const [salary, setSalary] = useState("15000");
  const [start, setStart] = useState(isFourteen ? "2025-07-01" : "2026-01-01");
  const [end, setEnd] = useState(isFourteen ? "2026-06-30" : "2026-12-31");
  const result = useMemo<ResultData | null>(() => {
    if (!validDate(start) || !validDate(end) || num(salary) <= 0) return null;
    const endD = utc(end);
    const p = isFourteen
      ? ctx.labor.fourteenthMonth.periodStart
      : ctx.labor.thirteenthMonth.periodStart;
    let periodStart = new Date(Date.UTC(endD.getUTCFullYear(), p.month - 1, p.day));
    if (endD < periodStart)
      periodStart = new Date(Date.UTC(endD.getUTCFullYear() - 1, p.month - 1, p.day));
    const from = utc(start) > periodStart ? utc(start) : periodStart;
    const days = endD < from ? 0 : Math.min(ctx.labor.dayBasis, days360Inclusive(from, endD));
    const amount = proportionalBonus(num(salary), days, ctx);
    const label = isFourteen ? ctx.labor.fourteenthMonth.label : ctx.labor.thirteenthMonth.label;
    return {
      title: label,
      rows: [
        ["Salario mensual", fmtL(num(salary))],
        [
          "Inicio del período",
          periodStart.toISOString().slice(0, 10).split("-").reverse().join("/"),
        ],
        ["Días trabajados (base 360)", String(days)],
        ["Cálculo", `${fmtL(num(salary))} × ${days} ÷ ${ctx.labor.dayBasis}`],
      ],
      total: [
        days >= ctx.labor.dayBasis ? "Te corresponde (completo)" : "Te corresponde (proporcional)",
        fmtL(amount),
      ],
      note: "Sin deducciones de IHSS ni RAP. Resultado orientativo según las reglas del sitio.",
    };
  }, [salary, start, end, isFourteen]);
  return (
    <Layout
      result={result}
      form={
        <>
          <Field id="salario" label="Salario mensual ordinario">
            <MoneyInput id="salario" value={salary} onChange={setSalary} />
          </Field>
          <Field
            id="ingreso"
            label="Fecha de ingreso"
            hint="Si entraste antes del inicio del período, se cuenta el período completo."
          >
            <Input
              id="ingreso"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field
            id="corte"
            label={
              isFourteen
                ? "Fecha de corte (30 de junio o de salida)"
                : "Fecha de corte (31 de diciembre o de salida)"
            }
          >
            <Input id="corte" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </>
      }
    />
  );
}

function LiquidationCalculator() {
  const [start, setStart] = useState("2022-03-01");
  const [end, setEnd] = useState("2026-09-30");
  const [salary, setSalary] = useState("18000");
  const [avg, setAvg] = useState("18500");
  const [reason, setReason] = useState("despido-injustificado");
  const [pending, setPending] = useState("0");
  const result = useMemo<ResultData | null>(() => {
    if (!validDate(start) || !validDate(end) || num(salary) <= 0) return null;
    const liq = computeLiquidation(
      {
        start,
        end,
        salary: num(salary),
        averageSalary: num(avg) || num(salary),
        reasonId: reason,
        pendingVacationDays: num(pending),
      },
      ctx,
    );
    return {
      title: `Tiempo de servicio: ${liq.d360} días (${liq.years} años y ${liq.months - liq.years * 12} meses)`,
      rows: [
        [`Preaviso (${liq.noticeDays} días)`, fmtL(liq.notice)],
        ["Auxilio de cesantía", fmtL(liq.severance)],
        [`Vacaciones proporcionales (${liq.vacationDays} días)`, fmtL(liq.vacation)],
        ["Vacaciones pendientes", fmtL(liq.vacationPending)],
        ["Décimo tercer mes proporcional", fmtL(liq.d13)],
        ["Décimo cuarto mes proporcional", fmtL(liq.d14)],
      ],
      total: ["Total estimado", fmtL(liq.total)],
      note: "No incluye salarios pendientes, deducciones ni casos especiales (embarazo, contrato por obra). Confirma con la Secretaría de Trabajo.",
    };
  }, [start, end, salary, avg, reason, pending]);
  return (
    <Layout
      result={result}
      form={
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="ingreso" label="Fecha de ingreso">
              <Input
                id="ingreso"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field id="salida" label="Fecha de salida">
              <Input id="salida" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <Field id="motivo" label="Motivo de salida">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="motivo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ctx.labor.terminationReasons.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="salario" label="Salario ordinario mensual">
              <MoneyInput id="salario" value={salary} onChange={setSalary} />
            </Field>
            <Field
              id="promedio"
              label="Salario promedio (últimos 6 meses)"
              hint="Incluye horas extra y comisiones."
            >
              <MoneyInput id="promedio" value={avg} onChange={setAvg} />
            </Field>
          </div>
          <Field id="pendientes" label="Días de vacaciones pendientes de años anteriores">
            <Input
              id="pendientes"
              type="number"
              min={0}
              value={pending}
              onChange={(e) => setPending(e.target.value)}
            />
          </Field>
        </>
      }
    />
  );
}

function IsrCalculator() {
  const it = ctx.taxes.incomeTax;
  const [monthly, setMonthly] = useState("40000");
  const [medical, setMedical] = useState(true);
  const result = useMemo<ResultData | null>(() => {
    const m = num(monthly);
    if (m <= 0) return null;
    const annual = round2(m * 12);
    const deductions = medical ? it.standardDeductions.reduce((s, d) => s + d.amount, 0) : 0;
    const taxable = Math.max(0, annual - deductions);
    const tax = annualIncomeTax(taxable, ctx);
    return {
      title: `ISR ${it.fiscalYear} estimado`,
      rows: [
        ["Ingreso anual (12 salarios)", fmtL(annual)],
        ["Deducciones", `− ${fmtL(deductions)}`],
        ["Renta neta gravable", fmtL(taxable)],
        ...tax.rows
          .filter((r) => r.amountInBracket > 0)
          .map(
            (r) =>
              [
                `${r.rate === 0 ? "Tramo exento" : `Tramo ${pct(r.rate)}`} sobre ${fmtL(r.amountInBracket)}`,
                fmtL(r.tax),
              ] as [string, string],
          ),
        ["Retención mensual aproximada", fmtL(round2(tax.total / it.withholding.projectionMonths))],
      ],
      total: ["ISR anual", fmtL(tax.total)],
      note: "Estimación simplificada con la tabla del módulo de reglas del sitio. No incluye otros ingresos ni deducciones adicionales.",
    };
  }, [monthly, medical, it]);
  return (
    <Layout
      result={result}
      form={
        <>
          <Field id="salario" label="Salario mensual">
            <MoneyInput id="salario" value={monthly} onChange={setMonthly} />
          </Field>
          {it.standardDeductions.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={medical}
                onChange={(e) => setMedical(e.target.checked)}
                className="size-4 accent-[var(--brand)]"
              />
              Aplicar deducción: {d.label} ({fmtL(d.amount)})
            </label>
          ))}
        </>
      }
    />
  );
}

function OvertimeCalculator() {
  const w = ctx.labor.workdays;
  const [salary, setSalary] = useState("15000");
  const [shift, setShift] = useState<"day" | "night" | "mixed">("day");
  const [hours, setHours] = useState<Record<string, string>>(
    Object.fromEntries(ctx.labor.overtime.map((o, i) => [o.id, i === 0 ? "10" : "0"])),
  );
  const result = useMemo<ResultData | null>(() => {
    const s = num(salary);
    if (s <= 0) return null;
    const hourly = round2(s / 30 / w[shift].hoursPerDay);
    const rows = ctx.labor.overtime.map((o) => {
      const rate = round2(hourly * (1 + o.surcharge));
      const h = num(hours[o.id] ?? "0");
      return { label: o.label, rate, h, amount: round2(rate * h), surcharge: o.surcharge };
    });
    return {
      title: "Pago de horas extra",
      rows: [
        ["Hora ordinaria", fmtL(hourly)],
        ...rows.map(
          (r) =>
            [`${r.label} (+${pct(r.surcharge)}): ${r.h} h × ${fmtL(r.rate)}`, fmtL(r.amount)] as [
              string,
              string,
            ],
        ),
      ],
      total: ["Total horas extra", fmtL(round2(rows.reduce((t, r) => t + r.amount, 0)))],
    };
  }, [salary, shift, hours, w]);
  return (
    <Layout
      result={result}
      form={
        <>
          <Field id="salario" label="Salario mensual">
            <MoneyInput id="salario" value={salary} onChange={setSalary} />
          </Field>
          <Field id="jornada" label="Jornada ordinaria">
            <Select value={shift} onValueChange={(v) => setShift(v as typeof shift)}>
              <SelectTrigger id="jornada">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diurna ({w.day.hoursPerDay} h diarias)</SelectItem>
                <SelectItem value="night">Nocturna ({w.night.hoursPerDay} h diarias)</SelectItem>
                <SelectItem value="mixed">Mixta ({w.mixed.hoursPerDay} h diarias)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {ctx.labor.overtime.map((o) => (
            <Field
              key={o.id}
              id={`h-${o.id}`}
              label={`Horas: ${o.label.toLowerCase()} (+${pct(o.surcharge)})`}
            >
              <Input
                id={`h-${o.id}`}
                type="number"
                min={0}
                step="0.5"
                value={hours[o.id] ?? "0"}
                onChange={(e) => setHours((h) => ({ ...h, [o.id]: e.target.value }))}
              />
            </Field>
          ))}
        </>
      }
    />
  );
}

const ISV_RATES = ctx.taxes.salesTax.rates.filter((r) => r.rate > 0);

function IsvCalculator() {
  const rates = ISV_RATES;
  const [amount, setAmount] = useState("1000");
  const [rateId, setRateId] = useState<string>(rates[0]?.id ?? "standard");
  const [included, setIncluded] = useState(false);
  const result = useMemo<ResultData | null>(() => {
    const rate = ISV_RATES.find((r) => r.id === rateId)?.rate ?? 0.15;
    const a = num(amount);
    if (a <= 0) return null;
    const b = salesTaxBreakdown(a, rate, included);
    return {
      title: included ? "Precio con ISV incluido, desglosado" : "Precio más ISV",
      rows: [
        ["Subtotal (sin ISV)", fmtL(b.subtotal)],
        [`ISV ${pct(rate)}`, fmtL(b.tax)],
      ],
      total: ["Total", fmtL(b.total)],
      note: included
        ? `Fórmula: subtotal = precio ÷ ${1 + rate}`
        : `Fórmula: ISV = subtotal × ${rate}`,
    };
  }, [amount, rateId, included]);
  return (
    <Layout
      result={result}
      form={
        <>
          <Field id="monto" label="Monto">
            <MoneyInput id="monto" value={amount} onChange={setAmount} />
          </Field>
          <Field id="tasa" label="Tasa">
            <Select value={rateId} onValueChange={setRateId}>
              <SelectTrigger id="tasa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rates.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label} — {r.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">El monto…</legend>
            {[
              [false, "No incluye ISV (quiero agregarlo)"],
              [true, "Ya incluye ISV (quiero sacarlo)"],
            ].map(([value, label]) => (
              <label key={String(value)} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="incluido"
                  checked={included === value}
                  onChange={() => setIncluded(value as boolean)}
                  className="accent-[var(--brand)]"
                />
                {label as string}
              </label>
            ))}
          </fieldset>
        </>
      }
    />
  );
}

function LoanCalculator() {
  const [principal, setPrincipal] = useState("200000");
  const [rate, setRate] = useState("18");
  const [months, setMonths] = useState("36");
  const result = useMemo<ResultData | null>(() => {
    const p = num(principal);
    const n = Math.round(num(months));
    if (p <= 0 || n <= 0 || n > 480) return null;
    const t = amortizationSchedule(p, num(rate) / 100, n);
    return {
      title: "Tu préstamo",
      rows: [
        ["Monto", fmtL(p)],
        ["Tasa anual", `${num(rate)} %`],
        ["Plazo", `${n} meses`],
        ["Intereses totales", fmtL(t.totalInterest)],
        ["Total a pagar", fmtL(round2(p + t.totalInterest))],
      ],
      total: ["Cuota mensual", fmtL(t.payment)],
      note: "Cuota nivelada (capital + intereses). No incluye seguros ni comisiones.",
      extra: (
        <details className="border-t px-5 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Ver los primeros 12 meses</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-xs tabular-nums">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1">Mes</th>
                  <th>Cuota</th>
                  <th>Interés</th>
                  <th>Capital</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {t.rows.slice(0, 12).map((r) => (
                  <tr key={r.n} className="border-t">
                    <td className="py-1">{r.n}</td>
                    <td>{fmtL(r.payment)}</td>
                    <td>{fmtL(r.interest)}</td>
                    <td>{fmtL(r.capital)}</td>
                    <td>{fmtL(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ),
    };
  }, [principal, rate, months]);
  return (
    <Layout
      result={result}
      form={
        <>
          <Field id="monto" label="Monto del préstamo">
            <MoneyInput id="monto" value={principal} onChange={setPrincipal} />
          </Field>
          <Field id="tasa" label="Tasa de interés anual (%)">
            <Input
              id="tasa"
              type="number"
              min={0}
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </Field>
          <Field id="plazo" label="Plazo (meses)">
            <Input
              id="plazo"
              type="number"
              min={1}
              max={480}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
            />
          </Field>
        </>
      }
    />
  );
}

export function CalculatorWidget({ slug }: { slug: string }) {
  switch (slug) {
    case "decimo-cuarto-mes":
      return <BonusCalculator kind="14" />;
    case "aguinaldo":
      return <BonusCalculator kind="13" />;
    case "prestaciones-laborales":
      return <LiquidationCalculator />;
    case "isr":
      return <IsrCalculator />;
    case "horas-extra":
      return <OvertimeCalculator />;
    case "isv":
      return <IsvCalculator />;
    case "cuota-de-prestamo":
      return <LoanCalculator />;
    default:
      return null;
  }
}
