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
import { taxIdText, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  taxId: taxIdText,
  municipality: text(60),
  year: yearSchema,
});

export type MunicipalConfig = z.infer<typeof configSchema>;

export const form = defineForm<MunicipalConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    taxId: "",
    municipality: "",
    year: currentYear(),
  }),
  formFields: [
    nameField("Nombre del negocio"),
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
      type: "text",
      name: "municipality",
      label: "Municipio",
      placeholder: "Ej. Distrito Central",
      maxLength: 60,
      section: SECTION_BUSINESS,
    },
    {
      type: "number",
      name: "year",
      label: "Año a pagar",
      description: "El impuesto se calcula con los ingresos del año anterior.",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
