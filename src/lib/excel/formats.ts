import type { CountryContext } from "@/countries";

/** Formatos numéricos de Excel compartidos por todas las plantillas. */
export const FMT = {
  integer: "#,##0",
  number: "#,##0.00",
  percent: "0.00%",
  percentShort: "0%",
  date: "dd/mm/yyyy",
  monthYear: "mmm yyyy",
  time: "hh:mm",
  hours: "0.00",
  text: "@",
} as const;

/** Formato de moneda con el símbolo del país: "L "#,##0.00 */
export function currencyFormat(ctx: CountryContext): string {
  const symbol = ctx.currency.symbol.replace(/"/g, "");
  const decimals = ctx.currency.decimals > 0 ? `.${"0".repeat(ctx.currency.decimals)}` : "";
  const positive = `"${symbol} "#,##0${decimals}`;
  return `${positive};[Red]-${positive};"${symbol} "-`;
}

/** Formato para montos en dólares (remesas, precios de referencia). */
export const USD_FORMAT = `"US$ "#,##0.00;[Red]-"US$ "#,##0.00;"US$ "-`;

/** Formateo en JavaScript (interfaz y vista previa). */
export function formatMoney(value: number, ctx: CountryContext): string {
  const formatted = new Intl.NumberFormat(ctx.currency.locale, {
    minimumFractionDigits: ctx.currency.decimals,
    maximumFractionDigits: ctx.currency.decimals,
  }).format(value);
  return `${ctx.currency.symbol} ${formatted}`;
}

export function formatPercent(rate: number, locale = "es-HN"): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(rate);
}
