import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  employees: stringList(200, 50).min(1, "Agrega al menos un empleado"),
  spareRows: z.coerce.number().int().min(0).max(100),
});

export type AsistenciaConfig = z.infer<typeof configSchema>;

export const form = defineForm<AsistenciaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    employees: ["Empleado 1", "Empleado 2", "Empleado 3", "Empleado 4", "Empleado 5"],
    spareRows: 10,
  }),
  formFields: [
    nameField("Nombre de la empresa"),
    ...periodFields(),
    {
      type: "list",
      name: "employees",
      label: "Empleados",
      maxItems: 200,
      addLabel: "Agregar empleado",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "spareRows",
      label: "Filas adicionales vacías",
      min: 0,
      max: 100,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
