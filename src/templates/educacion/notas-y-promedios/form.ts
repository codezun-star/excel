import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsCount, stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  section: text(60),
  subjects: stringList(15, 30).min(1, "Agrega al menos una asignatura"),
  periods: z.coerce.number().int().min(1).max(6),
  passing: z.coerce.number().min(1).max(100),
  students: rowsCount(5, 80),
});

export type NotasConfig = z.infer<typeof configSchema>;

export const form = defineForm<NotasConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    section: "",
    subjects: ["Español", "Matemáticas", "Ciencias Naturales", "Estudios Sociales", "Inglés"],
    periods: 4,
    passing: 70,
    students: 35,
  },
  formFields: [
    nameField("Centro educativo", "Ej. Escuela República de México"),
    {
      type: "text",
      name: "section",
      label: "Grado y sección",
      placeholder: "Ej. 5.º grado, sección A",
      maxLength: 60,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "subjects",
      label: "Asignaturas",
      maxItems: 15,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "periods",
      label: "Parciales",
      min: 1,
      max: 6,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "passing",
      label: "Nota mínima para aprobar",
      min: 1,
      max: 100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "students",
      label: "Cantidad de alumnos",
      min: 5,
      max: 80,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
