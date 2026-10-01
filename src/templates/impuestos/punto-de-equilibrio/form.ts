import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { money, stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  product: text(60),
  price: money,
  variableCost: money,
  fixedCosts: stringList(20, 40),
  targetProfit: money,
});

export type EquilibrioConfig = z.infer<typeof configSchema>;

export const form = defineForm<EquilibrioConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    product: "Producto principal",
    price: 120,
    variableCost: 70,
    fixedCosts: [
      "Alquiler",
      "Sueldos",
      "Energía y agua",
      "Internet y teléfono",
      "Otros gastos fijos",
    ],
    targetProfit: 20000,
  },
  formFields: [
    nameField(),
    {
      type: "text",
      name: "product",
      label: "Producto o servicio",
      maxLength: 60,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "price",
      label: "Precio de venta por unidad",
      min: 0,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "variableCost",
      label: "Costo variable por unidad",
      min: 0,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "fixedCosts",
      label: "Costos fijos mensuales",
      maxItems: 20,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "targetProfit",
      label: "Utilidad mensual deseada",
      min: 0,
      step: 1000,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
