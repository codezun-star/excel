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

export type PresupuestoAnualConfig = z.infer<typeof configSchema>;

export const form = defineForm<PresupuestoAnualConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    incomeCategories: ["Ventas", "Servicios", "Otros ingresos"],
    expenseCategories: [
      "Compras",
      "Sueldos",
      "Alquiler",
      "Servicios públicos",
      "Publicidad",
      "Mantenimiento",
      "Impuestos",
      "Otros gastos",
    ],
    rows: 600,
  }),
  formFields: [
    nameField(),
    {
      type: "number",
      name: "year",
      label: "Año del presupuesto",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "incomeCategories",
      label: "Categorías de ingresos",
      maxItems: 20,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "expenseCategories",
      label: "Categorías de gastos",
      maxItems: 40,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas para movimientos reales",
      min: 50,
      max: 5000,
      step: 50,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
