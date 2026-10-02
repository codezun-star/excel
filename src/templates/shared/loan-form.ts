import { z } from "zod";

import type { FormFieldDef } from "../types";
import { SECTION_CONTENT } from "./fields";
import { isoDate, money } from "./schema";

export const loanShape = {
  amount: money,
  annualRate: z.coerce.number({ error: "Escribe la tasa" }).min(0).max(200),
  months: z.coerce.number({ error: "Escribe el plazo" }).int().min(1).max(480),
  firstPayment: isoDate,
  method: z.enum(["nivelada", "capital-constante"]),
};

export function loanFields(
  opts: { amountLabel?: string; maxMonths?: number } = {},
): FormFieldDef[] {
  return [
    {
      type: "number",
      name: "amount",
      label: opts.amountLabel ?? "Monto del préstamo",
      min: 0,
      step: 1000,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "annualRate",
      label: "Tasa de interés anual",
      suffix: "%",
      min: 0,
      max: 200,
      step: 0.25,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "months",
      label: "Plazo en meses",
      min: 1,
      max: opts.maxMonths ?? 480,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "date",
      name: "firstPayment",
      label: "Fecha del primer pago",
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "method",
      label: "Tipo de cuota",
      options: [
        { value: "nivelada", label: "Cuota nivelada (la más común)" },
        { value: "capital-constante", label: "Capital constante (cuota decreciente)" },
      ],
      section: SECTION_CONTENT,
    },
  ];
}

export function nextMonthIso(): string {
  const d = new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
  return next.toISOString().slice(0, 10);
}
