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
  meals: stringList(6, 30).min(1),
  servings: z.coerce.number().int().min(1).max(20),
  exerciseGoal: z.coerce.number().int().min(0).max(1500),
});

export type ComidasConfig = z.infer<typeof configSchema>;

export const form = defineForm<ComidasConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    meals: ["Desayuno", "Merienda", "Almuerzo", "Cena"],
    servings: 4,
    exerciseGoal: 150,
  }),
  formFields: [
    nameField("Familia o persona (opcional)", "Ej. Familia Zúniga"),
    listField("meals", "Tiempos de comida", { itemPlaceholder: "Ej. Refacción", maxItems: 6 }),
    {
      type: "number",
      name: "servings",
      label: "Personas que comen en casa",
      min: 1,
      max: 20,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "exerciseGoal",
      label: "Meta de ejercicio (minutos por semana)",
      min: 0,
      max: 1500,
      step: 10,
      section: SECTION_CONTENT,
      description: "Una referencia común para adultos es 150 minutos de actividad moderada.",
    },
    ...ledgerDesignFields(),
  ],
});
