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
import { listField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  people: stringList(20, 40).min(1),
  expiryDays: z.coerce.number().int().min(1).max(365),
  reorderDays: z.coerce.number().int().min(1).max(90),
  medicines: rowsCount(10, 1000),
});

export type MedicamentosConfig = z.infer<typeof configSchema>;

export const form = defineForm<MedicamentosConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    people: ["Mamá", "Papá"],
    expiryDays: 30,
    reorderDays: 7,
    medicines: 60,
  }),
  formFields: [
    nameField("Familia, consultorio o institución (opcional)", "Ej. Familia Hernández"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    listField("people", "Personas o pacientes", {
      itemPlaceholder: "Ej. Abuela Toña",
      maxItems: 20,
    }),
    {
      type: "number",
      name: "expiryDays",
      label: "Avisar vencimiento con estos días de anticipación",
      min: 1,
      max: 365,
      step: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "reorderDays",
      label: "Avisar compra cuando queden estos días",
      min: 1,
      max: 90,
      step: 1,
      section: SECTION_CONTENT,
    },
    rowsField("medicines", "Filas de medicamentos", 10, 1000, 10),
    ...ledgerDesignFields(),
  ],
});
