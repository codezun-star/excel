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
  courses: stringList(20, 40).min(1),
  students: rowsCount(5, 1500),
});

export type AcademiaConfig = z.infer<typeof configSchema>;

export const form = defineForm<AcademiaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    courses: ["Inglés básico", "Inglés intermedio", "Guitarra", "Piano", "Reforzamiento escolar"],
    students: 100,
  }),
  formFields: [
    nameField("Nombre de la academia", "Ej. Academia Musical Allegro"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    listField("courses", "Cursos o programas", {
      itemPlaceholder: "Ej. Danza folclórica",
      maxItems: 20,
      description: "La inscripción y la mensualidad de cada curso se escriben en el archivo.",
    }),
    rowsField("students", "Cantidad de alumnos", 5, 1500, 5),
    ...ledgerDesignFields(),
  ],
});
