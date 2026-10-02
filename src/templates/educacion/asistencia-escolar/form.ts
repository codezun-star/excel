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
import { percentField, rowsField, textField } from "@/templates/shared/register";
import { rowsCount, text } from "@/templates/shared/schema";

export const MONTH_OPTIONS = [
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
].map((m, i) => ({
  value: String(i + 1),
  label: m,
}));

export const configSchema = z
  .object({
    ...ledgerBaseShape,
    group: text(60),
    teacher: text(80),
    year: yearSchema,
    firstMonth: z.coerce.number().int().min(1).max(12),
    lastMonth: z.coerce.number().int().min(1).max(12),
    saturdays: z.boolean(),
    minimum: z.coerce.number().min(0).max(100),
    students: rowsCount(5, 80),
  })
  .refine((c) => c.lastMonth >= c.firstMonth, {
    message: "El último mes debe ser igual o posterior al primero",
    path: ["lastMonth"],
  });

export type AsistenciaConfig = z.infer<typeof configSchema>;

export const form = defineForm<AsistenciaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    group: "",
    teacher: "",
    year: currentYear(),
    firstMonth: 2,
    lastMonth: 11,
    saturdays: false,
    minimum: 80,
    students: 35,
  }),
  formFields: [
    nameField("Nombre del centro educativo", "Ej. Escuela República de Panamá"),
    textField("group", "Grado y sección", "Ej. 5.º grado sección B", 60),
    textField("teacher", "Docente", "Ej. Prof. Lourdes Zavala"),
    {
      type: "number",
      name: "year",
      label: "Año escolar",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "firstMonth",
      label: "Primer mes de clases",
      options: MONTH_OPTIONS,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "lastMonth",
      label: "Último mes de clases",
      options: MONTH_OPTIONS,
      section: SECTION_CONTENT,
    },
    { type: "switch", name: "saturdays", label: "Incluir sábados", section: SECTION_CONTENT },
    percentField(
      "minimum",
      "Asistencia mínima",
      "Los alumnos por debajo de este porcentaje se marcan en rojo.",
    ),
    rowsField("students", "Cantidad de alumnos", 5, 80, 5),
    ...ledgerDesignFields(),
  ],
});
