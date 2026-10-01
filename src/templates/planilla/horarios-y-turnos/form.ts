import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  employees: stringList(100, 50).min(1, "Agrega al menos un empleado"),
  breakHours: z.coerce.number().min(0).max(4),
  spareRows: z.coerce.number().int().min(0).max(50),
});

export type HorariosConfig = z.infer<typeof configSchema>;

export const form = defineForm<HorariosConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    employees: ["Empleado 1", "Empleado 2", "Empleado 3"],
    breakHours: 1,
    spareRows: 5,
  },
  formFields: [
    nameField(),
    {
      type: "list",
      name: "employees",
      label: "Empleados",
      maxItems: 100,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "breakHours",
      label: "Horas de descanso por día",
      min: 0,
      max: 4,
      step: 0.5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "spareRows",
      label: "Filas adicionales",
      min: 0,
      max: 50,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
