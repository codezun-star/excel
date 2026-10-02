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
  units: rowsCount(1, 500),
});

export type AlquileresConfig = z.infer<typeof configSchema>;

export const form = defineForm<AlquileresConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, year: currentYear(), units: 10 }),
  formFields: [
    nameField("Nombre (opcional)", "Ej. Apartamentos Las Flores"),
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
      name: "units",
      label: "Cantidad de unidades en alquiler",
      min: 1,
      max: 500,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
