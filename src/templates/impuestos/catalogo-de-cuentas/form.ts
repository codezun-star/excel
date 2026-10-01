import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";

export const configSchema = z.object({
  ...ledgerBaseShape,
  spareRows: z.coerce.number().int().min(0).max(500),
});

export type CatalogoConfig = z.infer<typeof configSchema>;

export const form = defineForm<CatalogoConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, spareRows: 60 },
  formFields: [
    nameField("Nombre de la empresa"),
    {
      type: "number",
      name: "spareRows",
      label: "Filas libres para nuevas cuentas",
      min: 0,
      max: 500,
      step: 10,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
