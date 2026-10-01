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
import { rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  rows: rowsCount(50, 5000),
});

export type DiarioConfig = z.infer<typeof configSchema>;

export const form = defineForm<DiarioConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, ...periodDefaults(), rows: 500 }),
  formFields: [
    nameField("Nombre de la empresa"),
    ...periodFields(),
    {
      type: "number",
      name: "rows",
      label: "Filas del libro diario",
      min: 50,
      max: 5000,
      step: 50,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
