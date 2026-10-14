import { z } from "zod";

import { BILLING_DEFAULTS } from "@/config/plans";
import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  exchangeRate: z.coerce.number({ error: "Escribe el tipo de cambio" }).min(0.01).max(1000),
  rows: rowsCount(5, 500),
});

export type ImportacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<ImportacionConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    exchangeRate: BILLING_DEFAULTS.exchangeRateUsdHnl,
    rows: 30,
  },
  formFields: [
    nameField(),
    {
      type: "number",
      name: "exchangeRate",
      label: "Tipo de cambio (lempiras por dólar)",
      description: "Usa el tipo de cambio que aplica la aduana el día de la declaración.",
      min: 0.01,
      step: 0.0001,
      section: SECTION_CONTENT,
    },
    rowsField("rows", "Filas de productos", 5, 500, 5),
    ...ledgerDesignFields(),
  ],
});
