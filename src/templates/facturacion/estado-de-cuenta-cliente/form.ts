import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT, businessFields, paperField } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
} from "@/templates/shared/ledger-form";
import { imageDataUrl, paper, rowsCount, taxIdText, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  taxId: taxIdText,
  address: text(120),
  phone: text(40),
  email: text(80),
  logo: imageDataUrl,
  rows: rowsCount(10, 500),
  amountInWords: z.boolean(),
  notes: text(300),
  paper,
});

export type EstadoCuentaConfig = z.infer<typeof configSchema>;

export const form = defineForm<EstadoCuentaConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    taxId: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    rows: 40,
    amountInWords: true,
    notes: "Favor realizar su pago antes de la fecha de vencimiento. ¡Gracias por su preferencia!",
    paper: "letter",
  },
  formFields: [
    ...businessFields(),
    {
      type: "number",
      name: "rows",
      label: "Filas de movimientos",
      min: 10,
      max: 500,
      step: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "switch",
      name: "amountInWords",
      label: "Saldo final en letras",
      section: SECTION_CONTENT,
    },
    {
      type: "textarea",
      name: "notes",
      label: "Nota al pie",
      rows: 2,
      maxLength: 300,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    paperField,
    ...ledgerDesignFields(),
  ],
});
