import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  currentYear,
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  yearSchema,
} from "@/templates/shared/ledger-form";
import { listField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  people: stringList(10, 40).min(1),
  weightUnit: z.enum(["lb", "kg"]),
  rows: rowsCount(50, 10000),
});

export type SaludConfig = z.infer<typeof configSchema>;

export const form = defineForm<SaludConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    people: ["Yo"],
    weightUnit: "lb",
    rows: 1500,
  }),
  formFields: [
    listField("people", "Personas", { itemPlaceholder: "Ej. Mamá", maxItems: 10 }),
    {
      type: "number",
      name: "year",
      label: "Año de la evolución mensual",
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
    rowsField("rows", "Filas de mediciones", 50, 10000, 50),
    ...ledgerDesignFields(),
  ],
});
