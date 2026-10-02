import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { percentField, rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  margin: z.coerce.number().min(0).max(100),
  purchases: rowsCount(20, 3000),
  credits: rowsCount(50, 5000),
  clients: rowsCount(10, 1000),
});

export type PulperiaConfig = z.infer<typeof configSchema>;

export const form = defineForm<PulperiaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    margin: 20,
    purchases: 300,
    credits: 1000,
    clients: 100,
  }),
  formFields: [
    nameField("Nombre de la pulpería (opcional)", "Ej. Pulpería La Bendición"),
    ...periodFields(),
    percentField(
      "margin",
      "Margen de ganancia promedio",
      "Cuánto le ganas en promedio a lo que vendes. Sirve para estimar la ganancia del día.",
    ),
    rowsField("purchases", "Filas de compras", 20, 3000, 20),
    rowsField("credits", "Filas de fiados y abonos", 50, 5000, 50),
    rowsField("clients", "Filas de clientes", 10, 1000, 10),
    ...ledgerDesignFields(),
  ],
});
