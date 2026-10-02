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
  loans: rowsCount(10, 500),
  payments: rowsCount(50, 5000),
});

export type PrestamosConfig = z.infer<typeof configSchema>;

export const form = defineForm<PrestamosConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, loans: 50, payments: 500 },
  formFields: [
    nameField("Nombre de la empresa (opcional)"),
    rowsField("loans", "Filas de préstamos", 10, 500, 10),
    rowsField("payments", "Filas de abonos", 50, 5000, 50),
    ...ledgerDesignFields(),
  ],
});
