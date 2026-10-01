import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  currentYear,
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
  yearSchema,
} from "@/templates/shared/ledger-form";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  extraRows: z.coerce.number().int().min(0).max(100),
});

export type CalendarioConfig = z.infer<typeof configSchema>;

export const form = defineForm<CalendarioConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, year: currentYear(), extraRows: 20 }),
  formFields: [
    nameField("Nombre del contribuyente o empresa"),
    {
      type: "number",
      name: "year",
      label: "Año",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "extraRows",
      label: "Filas para obligaciones propias",
      min: 0,
      max: 100,
      step: 5,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
