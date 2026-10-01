import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { money, rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  openingFund: money,
  rows: rowsCount(20, 300),
  categories: stringList(20, 40),
  paymentMethods: stringList(10, 30),
});

export type CajaConfig = z.infer<typeof configSchema>;

export const form = defineForm<CajaConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    openingFund: 1000,
    rows: 60,
    categories: [
      "Venta de contado",
      "Cobro de crédito",
      "Compra de mercadería",
      "Pago a proveedor",
      "Gasto",
      "Retiro del dueño",
      "Depósito al banco",
    ],
    paymentMethods: ["Efectivo", "Tarjeta", "Transferencia"],
  },
  formFields: [
    nameField(),
    {
      type: "number",
      name: "openingFund",
      label: "Fondo inicial de caja",
      min: 0,
      step: 50,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas de movimientos",
      min: 20,
      max: 300,
      step: 10,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "categories",
      label: "Categorías de movimientos",
      maxItems: 20,
      addLabel: "Agregar categoría",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "paymentMethods",
      label: "Formas de pago",
      description: "La primera se considera efectivo para el arqueo.",
      maxItems: 10,
      addLabel: "Agregar forma de pago",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    ...ledgerDesignFields(),
  ],
});
