import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  rows: rowsCount(10, 3000),
  marginMethod: z.enum(["margen", "recargo"]),
  defaultMargin: z.coerce.number().min(0).max(95),
  roundTo: z.coerce.number().min(0).max(100),
  defaultRate: z.enum(["standard", "special", "exempt", "exonerated"]),
});

export type PreciosConfig = z.infer<typeof configSchema>;

export const form = defineForm<PreciosConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    rows: 200,
    marginMethod: "margen",
    defaultMargin: 25,
    roundTo: 1,
    defaultRate: "standard",
  },
  formFields: [
    nameField(),
    {
      type: "number",
      name: "rows",
      label: "Filas de productos",
      min: 10,
      max: 3000,
      step: 10,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "marginMethod",
      label: "Cómo calcular la ganancia",
      options: [
        { value: "margen", label: "Margen sobre el precio de venta" },
        { value: "recargo", label: "Recargo sobre el costo" },
      ],
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "defaultMargin",
      label: "Porcentaje predeterminado",
      suffix: "%",
      min: 0,
      max: 95,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "roundTo",
      label: "Redondear el precio final a múltiplos de",
      description: "0 = sin redondeo.",
      min: 0,
      max: 100,
      step: 0.25,
      section: SECTION_CONTENT,
    },
    {
      type: "select",
      name: "defaultRate",
      label: "Tasa de ISV predeterminada",
      options: (ctx) => ctx.taxes.salesTax.rates.map((r) => ({ value: r.id, label: r.label })),
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
