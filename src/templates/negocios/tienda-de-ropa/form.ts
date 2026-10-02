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
  sales: rowsCount(50, 20000),
  layaways: rowsCount(10, 2000),
});

export type RopaConfig = z.infer<typeof configSchema>;

export const form = defineForm<RopaConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    categories: ["Blusas", "Camisas", "Pantalones", "Vestidos", "Calzado", "Accesorios"],
    products: 500,
    sales: 3000,
    layaways: 200,
  },
  formFields: [
    nameField("Nombre de la tienda (opcional)"),
    listField("categories", "Categorías", {
      itemPlaceholder: "Ej. Ropa deportiva",
      maxItems: 30,
      addLabel: "Agregar categoría",
    }),
    rowsField("products", "Filas de inventario", 20, 5000, 20),
    rowsField("sales", "Filas de ventas", 50, 20000, 50),
    rowsField("layaways", "Filas de apartados", 10, 2000, 10),
    ...ledgerDesignFields(),
  ],
});
