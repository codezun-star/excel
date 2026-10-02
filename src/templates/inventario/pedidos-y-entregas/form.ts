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
  orders: rowsCount(20, 5000),
});

export type PedidosConfig = z.infer<typeof configSchema>;

export const form = defineForm<PedidosConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, orders: 500 },
  formFields: [
    nameField("Nombre del negocio (opcional)"),
    rowsField("orders", "Filas de pedidos", 20, 5000, 20),
    ...ledgerDesignFields(),
  ],
});
