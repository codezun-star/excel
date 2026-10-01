import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";

export const configSchema = z.object({ ...ledgerBaseShape });

export type IsrConfig = z.infer<typeof configSchema>;

export const form = defineForm<IsrConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults },
  formFields: [
    nameField("Nombre del contribuyente (opcional)", "Ej. Ana López"),
    ...ledgerDesignFields(),
  ],
});
