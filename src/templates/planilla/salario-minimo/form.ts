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

export const configSchema = z.object({ ...ledgerBaseShape, rows: rowsCount(5, 500) });

export type SalarioMinimoConfig = z.infer<typeof configSchema>;

export const form = defineForm<SalarioMinimoConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, rows: 30 },
  formFields: [
    nameField("Nombre de la empresa (opcional)"),
    {
      type: "number",
      name: "rows",
      label: "Filas del verificador",
      min: 5,
      max: 500,
      step: 5,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
