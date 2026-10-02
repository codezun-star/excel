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
  lots: rowsCount(20, 3000),
  movements: rowsCount(50, 10000),
  alertDays: z.coerce.number().int().min(1).max(365),
});

export type LotesConfig = z.infer<typeof configSchema>;

export const form = defineForm<LotesConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, lots: 300, movements: 2000, alertDays: 60 },
  formFields: [
    nameField("Nombre del negocio (opcional)"),
    rowsField("lots", "Filas de lotes", 20, 3000, 20),
    rowsField("movements", "Filas de salidas", 50, 10000, 50),
    rowsField(
      "alertDays",
      "Avisar cuando falten (días)",
      1,
      365,
      5,
      "Los lotes que vencen dentro de estos días se marcan como «Por vencer».",
    ),
    ...ledgerDesignFields(),
  ],
});
