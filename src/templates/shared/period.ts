import { z } from "zod";

import { MONTHS_ES } from "@/lib/excel/summary";

import type { FormFieldDef } from "../types";
import { SECTION_CONTENT } from "./fields";
import { currentYear, yearSchema } from "./ledger-form";

/** Campos de período mensual (mes + año). */
export const periodShape = {
  month: z.coerce.number({ error: "Elige un mes" }).int().min(1).max(12),
  year: yearSchema,
};

export function periodDefaults() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: currentYear() };
}

export function periodFields(section = SECTION_CONTENT): FormFieldDef[] {
  return [
    {
      type: "select",
      name: "month",
      label: "Mes",
      options: MONTHS_ES.map((m, i) => ({ value: String(i + 1), label: m })),
      section,
    },
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, step: 1, section },
  ];
}

export function periodLabel(month: number, year: number): string {
  return `${MONTHS_ES[month - 1] ?? ""} ${year}`;
}
