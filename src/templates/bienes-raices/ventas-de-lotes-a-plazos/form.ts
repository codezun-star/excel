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
import { moneyField, percentField, rowsField } from "@/templates/shared/register";
import { money, rowsCount } from "@/templates/shared/schema";

const percent = z.coerce.number().min(0).max(100);

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  unit: z.enum(["varas", "metros"]),
  pricePerUnit: money,
  rate: percent,
  term: z.coerce.number().int().min(1).max(240),
  lots: rowsCount(5, 3000),
  sales: rowsCount(5, 3000),
  payments: rowsCount(50, 50000),
});

export type LotesConfig = z.infer<typeof configSchema>;

export const form = defineForm<LotesConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    unit: "varas",
    pricePerUnit: 1200,
    rate: 12,
    term: 60,
    lots: 150,
    sales: 150,
    payments: 5000,
  }),
  formFields: [
    nameField("Lotificadora o proyecto", "Ej. Residencial Villas del Sol"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "unit",
      label: "Unidad de área",
      options: [
        { value: "varas", label: "Varas cuadradas" },
        { value: "metros", label: "Metros cuadrados" },
      ],
      section: SECTION_CONTENT,
    },
    moneyField("pricePerUnit", "Precio por vara o metro cuadrado", 50),
    percentField("rate", "Tasa de interés anual", "Escribe 0 si vendes sin intereses.", 40),
    {
      type: "number",
      name: "term",
      label: "Plazo habitual (meses)",
      min: 1,
      max: 240,
      step: 6,
      section: SECTION_CONTENT,
    },
    rowsField("lots", "Cantidad de lotes", 5, 3000, 5),
    rowsField("sales", "Filas de contratos", 5, 3000, 5),
    rowsField("payments", "Filas de pagos", 50, 50000, 50),
    ...ledgerDesignFields(),
  ],
});
