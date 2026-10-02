import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { moneyField, percentField } from "@/templates/shared/register";
import { isoDate, money } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  start: isoDate,
  own: money,
  loan: money,
  rate: z.coerce.number().min(0).max(100),
  term: z.coerce.number().int().min(1).max(120),
});

export type PlanConfig = z.infer<typeof configSchema>;

export const form = defineForm<PlanConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    start: "",
    own: 150000,
    loan: 100000,
    rate: 18,
    term: 24,
  }),
  formFields: [
    nameField("Nombre del negocio o proyecto", "Ej. Cafetería El Buen Grano"),
    {
      type: "date",
      name: "start",
      label: "Primer mes de operación",
      section: SECTION_CONTENT,
      description: "Si la dejas vacía se usa el mes siguiente.",
    },
    moneyField("own", "Aporte propio (capital)", 5000),
    moneyField("loan", "Préstamo", 5000, "Escribe 0 si no usarás préstamo."),
    percentField("rate", "Tasa de interés anual del préstamo", undefined, 80),
    {
      type: "number",
      name: "term",
      label: "Plazo del préstamo (meses)",
      min: 1,
      max: 120,
      step: 6,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
