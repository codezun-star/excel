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

export const configSchema = z.object({ ...ledgerBaseShape, year: yearSchema });

export type EstadosConfig = z.infer<typeof configSchema>;

export const form = defineForm<EstadosConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, year: currentYear() }),
  formFields: [
    nameField("Nombre de la empresa"),
    {
      type: "number",
      name: "year",
      label: "Año de los estados financieros",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
