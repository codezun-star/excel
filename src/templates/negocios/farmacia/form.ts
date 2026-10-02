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
  products: rowsCount(20, 5000),
  lots: rowsCount(20, 8000),
  sales: rowsCount(50, 20000),
  alertDays: z.coerce.number().int().min(1).max(365),
});

export type FarmaciaConfig = z.infer<typeof configSchema>;

export const form = defineForm<FarmaciaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    products: 500,
    lots: 1000,
    sales: 3000,
    alertDays: 90,
  }),
  formFields: [
    nameField("Nombre de la farmacia (opcional)"),
    ...periodFields(),
    rowsField("products", "Filas de medicamentos", 20, 5000, 20),
    rowsField("lots", "Filas de lotes", 20, 8000, 20),
    rowsField("sales", "Filas de ventas", 50, 20000, 50),
    rowsField(
      "alertDays",
      "Avisar cuando falten (días)",
      1,
      365,
      5,
      "Lotes que vencen dentro de estos días se marcan «Por vencer».",
    ),
    ...ledgerDesignFields(),
  ],
});
