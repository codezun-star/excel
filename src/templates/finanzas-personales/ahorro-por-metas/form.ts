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
  goals: rowsCount(3, 50),
  movements: rowsCount(20, 5000),
});

export type MetasConfig = z.infer<typeof configSchema>;

export const form = defineForm<MetasConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, goals: 10, movements: 500 },
  formFields: [
    nameField("Nombre (opcional)"),
    rowsField("goals", "Filas de metas", 3, 50, 1),
    rowsField("movements", "Filas de aportes", 20, 5000, 20),
    ...ledgerDesignFields(),
  ],
});
