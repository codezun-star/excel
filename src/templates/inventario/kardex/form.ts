import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsCount, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  product: text(60),
  code: text(20),
  unit: text(20),
  rows: rowsCount(20, 2000),
});

export type KardexConfig = z.infer<typeof configSchema>;

export const form = defineForm<KardexConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, product: "", code: "", unit: "Unidad", rows: 200 },
  formFields: [
    nameField(),
    { type: "text", name: "product", label: "Producto", maxLength: 60, section: SECTION_CONTENT },
    { type: "text", name: "code", label: "Código", maxLength: 20, section: SECTION_CONTENT },
    {
      type: "text",
      name: "unit",
      label: "Unidad de medida",
      maxLength: 20,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas de movimientos",
      min: 20,
      max: 2000,
      step: 20,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
