import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_BUSINESS, SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { rowsCount, taxIdText } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  taxId: taxIdText,
  rows: rowsCount(20, 2000),
});

export type LibroConfig = z.infer<typeof configSchema>;

export const form = defineForm<LibroConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, ...periodDefaults(), taxId: "", rows: 150 }),
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
    ...periodFields(),
    {
      type: "number",
      name: "rows",
      label: "Filas por libro",
      min: 20,
      max: 2000,
      step: 10,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
