import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { loanFields, loanShape, nextMonthIso } from "@/templates/shared/loan-form";
import { money } from "@/templates/shared/schema";

export const configSchema = z.object({ ...ledgerBaseShape, ...loanShape, extra: money });

export type SimuladorConfig = z.infer<typeof configSchema>;

export const form = defineForm<SimuladorConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    amount: 150_000,
    annualRate: 18,
    months: 36,
    firstPayment: nextMonthIso(),
    method: "nivelada",
    extra: 0,
  }),
  formFields: [
    nameField("Título (opcional)", "Ej. Préstamo para la moto"),
    ...loanFields({ maxMonths: 360 }),
    {
      type: "number",
      name: "extra",
      label: "Abono extra a capital cada mes (opcional)",
      min: 0,
      step: 100,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
