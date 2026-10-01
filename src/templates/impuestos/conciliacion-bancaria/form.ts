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
  bank: text(60),
  account: text(40),
  rows: rowsCount(5, 100),
});

export type ConciliacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<ConciliacionConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, bank: "", account: "", rows: 15 },
  formFields: [
    nameField("Nombre de la empresa"),
    {
      type: "text",
      name: "bank",
      label: "Banco",
      placeholder: "Ej. Banco Atlántida",
      maxLength: 60,
      section: SECTION_CONTENT,
    },
    {
      type: "text",
      name: "account",
      label: "N.º de cuenta",
      maxLength: 40,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas por sección",
      min: 5,
      max: 100,
      step: 5,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
