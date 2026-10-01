import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_BUSINESS } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { taxIdText } from "@/templates/shared/schema";

export const configSchema = z.object({ ...ledgerBaseShape, ...periodShape, taxId: taxIdText });

export type DeclaracionIsvConfig = z.infer<typeof configSchema>;

export const form = defineForm<DeclaracionIsvConfig>({
  configSchema,
  defaultConfig: () => ({ ...ledgerBaseDefaults, ...periodDefaults(), taxId: "" }),
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
    ...ledgerDesignFields(),
  ],
});
