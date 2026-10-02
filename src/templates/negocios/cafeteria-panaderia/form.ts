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
  products: rowsCount(5, 300),
  production: rowsCount(50, 20000),
  purchases: rowsCount(20, 5000),
});

export type PanaderiaConfig = z.infer<typeof configSchema>;

export const form = defineForm<PanaderiaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    products: 40,
    production: 1500,
    purchases: 300,
  }),
  formFields: [
    nameField("Nombre del negocio (opcional)"),
    ...periodFields(),
    rowsField("products", "Filas de productos", 5, 300, 5),
    rowsField("production", "Filas de producción diaria", 50, 20000, 50),
    rowsField("purchases", "Filas de compras de insumos", 20, 5000, 20),
    ...ledgerDesignFields(),
  ],
});
