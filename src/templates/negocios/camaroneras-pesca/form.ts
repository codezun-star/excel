import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ponds: rowsCount(1, 200),
  feed: rowsCount(20, 10000),
  costs: rowsCount(20, 5000),
  harvests: rowsCount(5, 2000),
});

export type CamaronConfig = z.infer<typeof configSchema>;

export const form = defineForm<CamaronConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, ponds: 10, feed: 1000, costs: 300, harvests: 50 },
  formFields: [
    nameField("Nombre de la granja (opcional)"),
    rowsField(
      "ponds",
      "Cantidad de estanques (ciclos)",
      1,
      200,
      1,
      "Una fila por estanque y ciclo de cultivo.",
    ),
    rowsField("feed", "Filas de alimento", 20, 10000, 20),
    rowsField("costs", "Filas de otros costos", 20, 5000, 20),
    rowsField("harvests", "Filas de cosechas", 5, 2000, 5),
    ...ledgerDesignFields(),
  ],
});
