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
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  rows: rowsCount(10, 2000),
});

export type ActivosConfig = z.infer<typeof configSchema>;

export const form = defineForm<ActivosConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, year: currentYear(), rows: 100 }),
  formFields: [
    nameField("Nombre de la empresa"),
    {
      type: "number",
      name: "year",
      label: "Año de cierre (fecha de corte 31 de diciembre)",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas de activos",
      min: 10,
      max: 2000,
      step: 10,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
