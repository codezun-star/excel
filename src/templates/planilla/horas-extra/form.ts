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
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  employees: stringList(100, 50),
  rows: rowsCount(20, 3000),
});

export type HorasExtraConfig = z.infer<typeof configSchema>;

export const form = defineForm<HorasExtraConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    employees: ["Empleado 1", "Empleado 2", "Empleado 3"],
    rows: 200,
  }),
  formFields: [
    nameField("Nombre de la empresa"),
    ...periodFields(),
    {
      type: "list",
      name: "employees",
      label: "Empleados",
      maxItems: 100,
      addLabel: "Agregar empleado",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas de registro",
      min: 20,
      max: 3000,
      step: 20,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
