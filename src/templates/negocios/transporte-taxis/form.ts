import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  units: rowsCount(1, 100),
  rows: rowsCount(30, 10000),
  services: rowsCount(10, 2000),
});

export type TaxisConfig = z.infer<typeof configSchema>;

export const form = defineForm<TaxisConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    units: 5,
    rows: 500,
    services: 100,
  }),
  formFields: [
    nameField("Nombre de la empresa o dueño (opcional)"),
    ...periodFields(),
    rowsField("units", "Cantidad de unidades", 1, 100, 1),
    rowsField("rows", "Filas del registro diario", 30, 10000, 30),
    rowsField("services", "Filas de mantenimientos", 10, 2000, 10),
    ...ledgerDesignFields(),
  ],
});
