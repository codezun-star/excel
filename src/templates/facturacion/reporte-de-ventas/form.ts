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
  rows: rowsCount(50, 3000),
  categories: stringList(30, 40),
  paymentMethods: stringList(12, 40),
  includeInvoice: z.boolean(),
  includeSeller: z.boolean(),
  sellers: stringList(30, 40),
});

export type ReporteVentasConfig = z.infer<typeof configSchema>;

export const form = defineForm<ReporteVentasConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    rows: 500,
    categories: ["Abarrotes", "Bebidas", "Lácteos", "Limpieza", "Otros"],
    paymentMethods: ["Efectivo", "Tarjeta", "Transferencia", "Crédito"],
    includeInvoice: true,
    includeSeller: false,
    sellers: ["Vendedor 1", "Vendedor 2"],
  }),
  formFields: [
    nameField(),
    {
      type: "number",
      name: "year",
      label: "Año del reporte",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas para ventas",
      min: 50,
      max: 3000,
      step: 50,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "categories",
      label: "Categorías de productos",
      itemPlaceholder: "Ej. Bebidas",
      maxItems: 30,
      addLabel: "Agregar categoría",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "paymentMethods",
      label: "Formas de pago",
      maxItems: 12,
      addLabel: "Agregar forma de pago",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "switch",
      name: "includeInvoice",
      label: "Columna de número de factura",
      section: SECTION_CONTENT,
    },
    {
      type: "switch",
      name: "includeSeller",
      label: "Registrar vendedor",
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "sellers",
      label: "Vendedores",
      maxItems: 30,
      addLabel: "Agregar vendedor",
      section: SECTION_CONTENT,
      showWhen: { field: "includeSeller", equals: true },
      fullWidth: true,
    },
    ...ledgerDesignFields(),
  ],
});
