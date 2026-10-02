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
import { listField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  properties: rowsCount(1, 200),
  expenseCategories: stringList(25, 40).min(1),
  rows: rowsCount(50, 10000),
});

export type PropiedadesConfig = z.infer<typeof configSchema>;

export const form = defineForm<PropiedadesConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    properties: 10,
    expenseCategories: [
      "Impuesto de bienes inmuebles",
      "Mantenimiento",
      "Reparaciones",
      "Energía y agua",
      "Seguro",
      "Cuota de residencial",
      "Comisión de administración",
      "Préstamo (cuota)",
      "Otros",
    ],
    rows: 1000,
  }),
  formFields: [
    nameField("Nombre del propietario o empresa (opcional)", "Ej. Familia Rodríguez"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    rowsField("properties", "Cantidad de propiedades", 1, 200, 1),
    listField("expenseCategories", "Categorías de gasto", {
      itemPlaceholder: "Ej. Vigilancia",
      maxItems: 25,
    }),
    rowsField("rows", "Filas del registro", 50, 10000, 50),
    ...ledgerDesignFields(),
  ],
});
