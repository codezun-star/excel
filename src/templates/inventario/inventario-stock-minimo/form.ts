import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  products: rowsCount(10, 3000),
  movements: rowsCount(50, 10000),
  categories: stringList(30, 40),
  units: stringList(20, 20),
});

export type InventarioConfig = z.infer<typeof configSchema>;

export const form = defineForm<InventarioConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    products: 200,
    movements: 1000,
    categories: ["Abarrotes", "Bebidas", "Lácteos", "Limpieza", "Higiene personal", "Otros"],
    units: ["Unidad", "Caja", "Paquete", "Libra", "Kilo", "Litro", "Galón"],
  },
  formFields: [
    nameField(),
    {
      type: "number",
      name: "products",
      label: "Filas de productos",
      min: 10,
      max: 3000,
      step: 10,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "movements",
      label: "Filas de movimientos",
      min: 50,
      max: 10000,
      step: 50,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "categories",
      label: "Categorías",
      maxItems: 30,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "units",
      label: "Unidades de medida",
      maxItems: 20,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    ...ledgerDesignFields(),
  ],
});
