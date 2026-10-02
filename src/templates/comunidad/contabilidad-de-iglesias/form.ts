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
  opening: money,
  incomeCategories: stringList(20, 40).min(1),
  expenseCategories: stringList(25, 40).min(1),
  rows: rowsCount(50, 20000),
  members: rowsCount(10, 3000),
});

export type IglesiaConfig = z.infer<typeof configSchema>;

export const form = defineForm<IglesiaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    opening: 0,
    incomeCategories: [
      "Diezmos",
      "Ofrendas",
      "Donaciones",
      "Actividades",
      "Misiones",
      "Otros ingresos",
    ],
    expenseCategories: [
      "Alquiler",
      "Energía y agua",
      "Ayuda social",
      "Misiones",
      "Mantenimiento",
      "Apoyo pastoral",
      "Eventos",
      "Materiales",
      "Otros gastos",
    ],
    rows: 2000,
    members: 200,
  }),
  formFields: [
    nameField("Nombre de la iglesia u organización", "Ej. Iglesia Cristiana Nueva Vida"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    moneyField("opening", "Saldo inicial en caja y banco", 100),
    listField("incomeCategories", "Categorías de ingreso", {
      itemPlaceholder: "Ej. Pro templo",
      maxItems: 20,
    }),
    listField("expenseCategories", "Categorías de gasto", {
      itemPlaceholder: "Ej. Transporte",
      maxItems: 25,
    }),
    rowsField("rows", "Filas del registro", 50, 20000, 50),
    rowsField("members", "Filas de miembros o donantes", 10, 3000, 10),
    ...ledgerDesignFields(),
  ],
});
