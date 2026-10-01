import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { money, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  openingBalance: money,
  incomeCategories: stringList(25, 40).min(1),
  expenseCategories: stringList(40, 40).min(1),
});

export type FlujoConfig = z.infer<typeof configSchema>;

export const form = defineForm<FlujoConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    month: 1,
    openingBalance: 25000,
    incomeCategories: [
      "Ventas de contado",
      "Cobros a clientes",
      "Préstamos recibidos",
      "Otros ingresos",
    ],
    expenseCategories: [
      "Compras de mercadería",
      "Sueldos y salarios",
      "Alquiler",
      "Energía y agua",
      "Internet y teléfono",
      "Transporte",
      "Impuestos",
      "Pago de préstamos",
      "Otros gastos",
    ],
  }),
  formFields: [
    nameField(),
    ...periodFields(),
    {
      type: "number",
      name: "openingBalance",
      label: "Saldo inicial de efectivo",
      min: 0,
      step: 100,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "incomeCategories",
      label: "Categorías de ingresos",
      maxItems: 25,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "expenseCategories",
      label: "Categorías de egresos",
      maxItems: 40,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    ...ledgerDesignFields(),
  ],
});
