import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_BUSINESS, SECTION_CONTENT } from "@/templates/shared/fields";
import {
  currentYear,
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
  yearSchema,
} from "@/templates/shared/ledger-form";
import { rowsField } from "@/templates/shared/register";
import { rowsCount, taxIdText } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  taxId: taxIdText,
  year: yearSchema,
  rows: rowsCount(20, 5000),
});

export type RetencionesConfig = z.infer<typeof configSchema>;

export const form = defineForm<RetencionesConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, taxId: "", year: currentYear(), rows: 300 }),
  formFields: [
    nameField("Nombre o razón social"),
    {
      type: "text",
      name: "taxId",
      label: "RTN",
      taxId: true,
      maxLength: 25,
      section: SECTION_BUSINESS,
      profileKey: "rtn",
    },
    {
      type: "number",
      name: "year",
      label: "Año",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    rowsField("rows", "Filas de retenciones", 20, 5000, 20),
    ...ledgerDesignFields(),
  ],
});
