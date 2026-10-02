import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
} from "@/templates/shared/ledger-form";
import { listField, rowsField, textField } from "@/templates/shared/register";
import { rowsCount, stringList, text } from "@/templates/shared/schema";

export const configSchema = z
  .object({
    ...ledgerBaseShape,
    student: text(80),
    subjects: stringList(15, 40).min(1),
    firstHour: z.coerce.number().int().min(4).max(20),
    lastHour: z.coerce.number().int().min(5).max(23),
    sessions: rowsCount(50, 5000),
  })
  .refine((c) => c.lastHour > c.firstHour, {
    message: "La última hora debe ser posterior a la primera",
    path: ["lastHour"],
  });

export type EstudioConfig = z.infer<typeof configSchema>;

export const form = defineForm<EstudioConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    student: "",
    subjects: ["Matemáticas", "Español", "Química", "Historia de Honduras", "Inglés"],
    firstHour: 6,
    lastHour: 21,
    sessions: 500,
  }),
  formFields: [
    textField("student", "Nombre del estudiante (opcional)", "Ej. Andrea Castillo"),
    listField("subjects", "Materias o clases", { itemPlaceholder: "Ej. Cálculo I", maxItems: 15 }),
    {
      type: "number",
      name: "firstHour",
      label: "Primera hora del horario (0 a 23)",
      min: 4,
      max: 20,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "lastHour",
      label: "Última hora del horario (0 a 23)",
      min: 5,
      max: 23,
      step: 1,
      section: SECTION_CONTENT,
    },
    rowsField("sessions", "Filas de sesiones de estudio", 50, 5000, 50),
    ...ledgerDesignFields(),
  ],
});
