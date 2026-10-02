import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  currentYear,
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
  yearSchema,
} from "@/templates/shared/ledger-form";
import { listField, moneyField, rowsField } from "@/templates/shared/register";
import { money, rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  sellers: stringList(30, 40).min(1),
  monthlyGoal: money,
  rows: rowsCount(50, 20000),
});

export type MetasConfig = z.infer<typeof configSchema>;

export const form = defineForm<MetasConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    sellers: ["María", "Carlos", "Tienda en línea"],
    monthlyGoal: 50000,
    rows: 3000,
  }),
  formFields: [
    nameField("Negocio", "Ej. Distribuidora El Valle"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    listField("sellers", "Vendedores, sucursales o canales", {
      itemPlaceholder: "Ej. Sucursal Centro",
      maxItems: 30,
    }),
    moneyField(
      "monthlyGoal",
      "Meta mensual inicial para cada uno",
      1000,
      "Puedes cambiar cada meta en el archivo.",
    ),
    rowsField("rows", "Filas de ventas", 50, 20000, 50),
    ...ledgerDesignFields(),
  ],
});
