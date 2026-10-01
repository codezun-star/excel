import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { paper } from "@/templates/shared/schema";
import { paperField } from "@/templates/shared/fields";

export const configSchema = z.object({
  ...ledgerBaseShape,
  paper,
});

export type PrestacionesConfig = z.infer<typeof configSchema>;

export const form = defineForm<PrestacionesConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, paper: "letter" },
  formFields: [
    nameField("Nombre del empleador (opcional)"),
    { ...paperField, section: SECTION_CONTENT },
    ...ledgerDesignFields(),
  ],
});
