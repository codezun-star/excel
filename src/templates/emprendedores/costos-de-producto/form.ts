import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { moneyField, percentField, rowsField } from "@/templates/shared/register";
import { money, rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  laborHour: money,
  margin: z.coerce.number().min(0).max(95),
  products: rowsCount(3, 300),
});

export type CostosConfig = z.infer<typeof configSchema>;

export const form = defineForm<CostosConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    laborHour: 60,
    margin: 40,
    products: 30,
  }),
  formFields: [
    nameField("Nombre del negocio", "Ej. Panadería Doña Tere"),
    moneyField(
      "laborHour",
      "Costo de mano de obra por hora",
      5,
      "Lo que pagas (o te pagas) por cada hora de trabajo.",
    ),
    percentField(
      "margin",
      "Margen de ganancia deseado",
      "Porcentaje del precio de venta que quieres que sea ganancia.",
      95,
    ),
    rowsField("products", "Cantidad de productos", 3, 300, 1),
    ...ledgerDesignFields(),
  ],
});
