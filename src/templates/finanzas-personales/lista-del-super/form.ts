import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { listField, moneyField, rowsField } from "@/templates/shared/register";
import { money, rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  budget: money,
  aisles: stringList(20, 40).min(1, "Agrega al menos un pasillo"),
  rows: rowsCount(20, 500),
});

export type SuperConfig = z.infer<typeof configSchema>;

export const form = defineForm<SuperConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    budget: 4000,
    aisles: [
      "Frutas y verduras",
      "Carnes y pollo",
      "Lácteos y huevos",
      "Panadería",
      "Granos y abarrotes",
      "Bebidas",
      "Limpieza",
      "Higiene personal",
      "Bebé y mascotas",
      "Otros",
    ],
    rows: 80,
  },
  formFields: [
    nameField("Supermercado (opcional)", "Ej. Súper de la colonia"),
    moneyField("budget", "Presupuesto de la compra", 100),
    listField("aisles", "Pasillos", {
      itemPlaceholder: "Ej. Congelados",
      maxItems: 20,
      addLabel: "Agregar pasillo",
    }),
    rowsField("rows", "Filas de productos", 20, 500, 10),
    ...ledgerDesignFields(),
  ],
});
