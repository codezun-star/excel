import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { listField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  categories: stringList(30, 40).min(1, "Agrega al menos una categoría"),
  products: rowsCount(20, 5000),
  quoteLines: rowsCount(5, 60),
  credits: rowsCount(20, 3000),
});

export type FerreteriaConfig = z.infer<typeof configSchema>;

export const form = defineForm<FerreteriaConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    categories: [
      "Construcción",
      "Electricidad",
      "Fontanería",
      "Herramientas",
      "Pinturas",
      "Tornillería",
    ],
    products: 500,
    quoteLines: 20,
    credits: 300,
  },
  formFields: [
    nameField("Nombre de la ferretería (opcional)", "Ej. Ferretería El Constructor"),
    listField("categories", "Categorías de productos", {
      itemPlaceholder: "Ej. Jardinería",
      maxItems: 30,
      addLabel: "Agregar categoría",
    }),
    rowsField("products", "Filas de productos", 20, 5000, 20),
    rowsField("quoteLines", "Líneas de la cotización", 5, 60, 1),
    rowsField("credits", "Filas de ventas al crédito", 20, 3000, 20),
    ...ledgerDesignFields(),
  ],
});
