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
  include: z.array(z.enum(["thirteenth", "fourteenth"])).min(1, "Elige al menos uno"),
  rows: rowsCount(5, 500),
});

export type DecimosConfig = z.infer<typeof configSchema>;

export const form = defineForm<DecimosConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    include: ["thirteenth", "fourteenth"],
    rows: 25,
  }),
  formFields: [
    nameField("Nombre de la empresa"),
    {
      type: "number",
      name: "year",
      label: "Año de pago",
      description:
        "El décimo cuarto se calcula del 1 de julio del año anterior al 30 de junio de este año.",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "multiselect",
      name: "include",
      label: "Calcular",
      options: [
        { value: "thirteenth", label: "Décimo tercer mes (aguinaldo)" },
        { value: "fourteenth", label: "Décimo cuarto mes" },
      ],
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "rows",
      label: "Cantidad de empleados (filas)",
      min: 5,
      max: 500,
      step: 5,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
