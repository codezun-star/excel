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
import { rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  weightUnit: z.enum(["lb", "kg"]),
  patients: rowsCount(20, 10000),
  visits: rowsCount(50, 30000),
});

export type HistorialConfig = z.infer<typeof configSchema>;

export const form = defineForm<HistorialConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    weightUnit: "lb",
    patients: 500,
    visits: 3000,
  }),
  formFields: [
    nameField("Nombre de la clínica o del profesional", "Ej. Consultorio Dr. Ramírez"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "weightUnit",
      label: "Unidad de peso",
      options: [
        { value: "lb", label: "Libras" },
        { value: "kg", label: "Kilogramos" },
      ],
      section: SECTION_CONTENT,
    },
    rowsField("patients", "Filas de pacientes", 20, 10000, 20),
    rowsField("visits", "Filas de consultas", 50, 30000, 50),
    ...ledgerDesignFields(),
  ],
});
