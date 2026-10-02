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
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  incomeCategories: stringList(20, 40).min(1),
  expenseCategories: stringList(40, 40).min(1),
  rows: rowsCount(50, 5000),
});

export type GastosConfig = z.infer<typeof configSchema>;

export const form = defineForm<GastosConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    incomeCategories: ["Salario", "Remesas", "Ventas", "Otros ingresos"],
    expenseCategories: [
      "Alimentación",
      "Vivienda",
      "Servicios",
      "Transporte",
      "Educación",
      "Salud",
      "Deudas",
      "Entretenimiento",
      "Otros gastos",
    ],
    rows: 1000,
  }),
  formFields: [
    nameField("Nombre (opcional)", "Ej. Mis finanzas 2026"),
    {
      type: "number",
      name: "year",
      label: "Año",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "incomeCategories",
      label: "Categorías de ingreso",
      maxItems: 20,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "expenseCategories",
      label: "Categorías de gasto",
      maxItems: 40,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas de registro",
      min: 50,
      max: 5000,
      step: 50,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
