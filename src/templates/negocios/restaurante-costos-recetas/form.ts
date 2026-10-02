import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { percentField, rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ingredients: rowsCount(20, 2000),
  dishes: rowsCount(5, 500),
  recipeLines: rowsCount(50, 10000),
  targetFoodCost: z.coerce.number().min(5).max(90),
});

export type RecetasConfig = z.infer<typeof configSchema>;

export const form = defineForm<RecetasConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    ingredients: 200,
    dishes: 60,
    recipeLines: 800,
    targetFoodCost: 30,
  },
  formFields: [
    nameField("Nombre del restaurante (opcional)"),
    rowsField("ingredients", "Filas de insumos", 20, 2000, 20),
    rowsField("dishes", "Filas de platillos", 5, 500, 5),
    rowsField("recipeLines", "Filas de recetas (ingredientes por platillo)", 50, 10000, 50),
    percentField(
      "targetFoodCost",
      "Food cost objetivo",
      "Qué porcentaje del precio quieres que sea costo de ingredientes (en restaurantes suele estar entre 25 % y 35 %).",
      90,
    ),
    ...ledgerDesignFields(),
  ],
});
