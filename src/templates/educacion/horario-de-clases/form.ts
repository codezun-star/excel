import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { listField } from "@/templates/shared/register";
import { stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  groups: stringList(12, 40).min(1),
  subjects: stringList(20, 40).min(1),
  saturdays: z.boolean(),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Usa el formato HH:MM"),
  minutes: z.coerce.number().int().min(20).max(120),
  periods: z.coerce.number().int().min(2).max(12),
  breakAfter: z.coerce.number().int().min(0).max(12),
  breakMinutes: z.coerce.number().int().min(0).max(90),
});

export type HorarioConfig = z.infer<typeof configSchema>;

export const form = defineForm<HorarioConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    groups: ["1.º grado", "2.º grado", "3.º grado"],
    subjects: [
      "Español",
      "Matemáticas",
      "Ciencias Naturales",
      "Ciencias Sociales",
      "Inglés",
      "Educación Física",
      "Educación Artística",
      "Computación",
      "Formación Ciudadana",
    ],
    saturdays: false,
    start: "07:00",
    minutes: 45,
    periods: 7,
    breakAfter: 3,
    breakMinutes: 30,
  }),
  formFields: [
    nameField("Nombre del centro educativo", "Ej. Instituto San José"),
    listField("groups", "Grados o secciones (una hoja por cada uno)", {
      itemPlaceholder: "Ej. 7.º A",
      maxItems: 12,
    }),
    listField("subjects", "Materias", { itemPlaceholder: "Ej. Física", maxItems: 20 }),
    {
      type: "text",
      name: "start",
      label: "Hora de entrada (HH:MM, 24 horas)",
      placeholder: "07:00",
      maxLength: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "minutes",
      label: "Minutos por periodo",
      min: 20,
      max: 120,
      step: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "periods",
      label: "Periodos por día",
      min: 2,
      max: 12,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "breakAfter",
      label: "Recreo después del periodo",
      min: 0,
      max: 12,
      step: 1,
      section: SECTION_CONTENT,
      description: "Escribe 0 si no hay recreo.",
    },
    {
      type: "number",
      name: "breakMinutes",
      label: "Minutos de recreo",
      min: 0,
      max: 90,
      step: 5,
      section: SECTION_CONTENT,
    },
    { type: "switch", name: "saturdays", label: "Incluir sábado", section: SECTION_CONTENT },
    ...ledgerDesignFields(),
  ],
});
