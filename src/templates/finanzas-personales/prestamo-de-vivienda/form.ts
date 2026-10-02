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

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...loanShape,
  homeValue: money,
  insurance: money,
  extra: money,
});

export type ViviendaConfig = z.infer<typeof configSchema>;

export const form = defineForm<ViviendaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    homeValue: 1_800_000,
    amount: 1_500_000,
    annualRate: 11,
    months: 240,
    firstPayment: nextMonthIso(),
    method: "nivelada",
    insurance: 900,
    extra: 0,
  }),
  formFields: [
    nameField("Título (opcional)", "Ej. Casa en Residencial Los Pinos"),
    {
      type: "number",
      name: "homeValue",
      label: "Valor de la vivienda",
      min: 0,
      step: 10000,
      section: SECTION_CONTENT,
    },
    ...loanFields({ amountLabel: "Monto a financiar", maxMonths: 360 }),
    {
      type: "number",
      name: "insurance",
      label: "Seguros mensuales (vida y daños)",
      min: 0,
      step: 50,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "extra",
      label: "Abono extra a capital cada mes (opcional)",
      min: 0,
      step: 500,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
