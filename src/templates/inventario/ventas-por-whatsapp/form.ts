import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  currentYear,
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
  yearSchema,
} from "@/templates/shared/ledger-form";
import { rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";
import { SECTION_CONTENT } from "@/templates/shared/fields";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  orders: rowsCount(50, 10000),
  clients: rowsCount(10, 2000),
});

export type WhatsappConfig = z.infer<typeof configSchema>;

export const form = defineForm<WhatsappConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, year: currentYear(), orders: 1000, clients: 200 }),
  formFields: [
    nameField("Nombre de tu tienda (opcional)"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    rowsField("orders", "Filas de pedidos", 50, 10000, 50),
    rowsField("clients", "Filas de clientes", 10, 2000, 10),
    ...ledgerDesignFields(),
  ],
});
