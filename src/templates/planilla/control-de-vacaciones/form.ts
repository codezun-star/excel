import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  employees: rowsCount(5, 500),
  logRows: rowsCount(20, 3000),
});

export type VacacionesConfig = z.infer<typeof configSchema>;

export const form = defineForm<VacacionesConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, employees: 25, logRows: 200 },
  formFields: [
    nameField("Nombre de la empresa"),
    {
      type: "number",
      name: "employees",
      label: "Cantidad de empleados (filas)",
      min: 5,
      max: 500,
      step: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "logRows",
      label: "Filas para registrar vacaciones",
      min: 20,
      max: 3000,
      step: 20,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
