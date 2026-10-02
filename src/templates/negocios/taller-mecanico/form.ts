import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import { rowsField } from "@/templates/shared/register";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  orders: rowsCount(20, 3000),
  parts: rowsCount(50, 10000),
  chargeTax: z.boolean(),
});

export type TallerConfig = z.infer<typeof configSchema>;

export const form = defineForm<TallerConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, orders: 300, parts: 1500, chargeTax: true },
  formFields: [
    nameField("Nombre del taller (opcional)", "Ej. Taller Mecánico Hermanos Díaz"),
    rowsField("orders", "Filas de órdenes", 20, 3000, 20),
    rowsField("parts", "Filas de repuestos", 50, 10000, 50),
    {
      type: "switch",
      name: "chargeTax",
      label: "Cobrar ISV en las órdenes",
      description: "Suma el impuesto sobre ventas del país al total de cada orden.",
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
