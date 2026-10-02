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
import { money, rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  firstMonth: z.coerce.number().int().min(1).max(12),
  months: z.coerce.number().int().min(1).max(12),
  enrollment: money,
  fee: money,
  students: rowsCount(5, 2000),
});

export type PensionesConfig = z.infer<typeof configSchema>;

export const form = defineForm<PensionesConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    firstMonth: 2,
    months: 10,
    enrollment: 2000,
    fee: 1500,
    students: 150,
  }),
  formFields: [
    nameField("Nombre del centro educativo"),
    {
      type: "number",
      name: "year",
      label: "Año escolar",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "firstMonth",
      label: "Mes de inicio de clases",
      options: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ].map((m, i) => ({ value: String(i + 1), label: m })),
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "months",
      label: "Mensualidades en el año",
      min: 1,
      max: 12,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "enrollment",
      label: "Matrícula",
      min: 0,
      step: 100,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "fee",
      label: "Mensualidad",
      min: 0,
      step: 50,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "students",
      label: "Cantidad de alumnos (filas)",
      min: 5,
      max: 2000,
      step: 5,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
