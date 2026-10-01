import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  SECTION_NUMBERING,
  businessFields,
  documentBaseDefaults,
  documentBaseShape,
  documentDesignFields,
  fiscalDefaults,
  fiscalFields,
  fiscalShape,
  linesFields,
  numberingFields,
  rateField,
} from "@/templates/shared/document-form";

export const configSchema = z.object({
  ...documentBaseShape,
  ...fiscalShape,
  noteType: z.enum(["credito", "debito"]),
  defaultRate: z.enum(["standard", "special", "exempt", "exonerated"]),
});

export type NotaConfig = z.infer<typeof configSchema>;

export const form = defineForm<NotaConfig>({
  configSchema,
  defaultConfig: (ctx) => ({
    ...documentBaseDefaults(ctx),
    ...fiscalDefaults,
    prefix: ctx.invoicing.documentPrefixes.creditNote,
    noteType: "credito",
    defaultRate: "standard",
  }),
  formFields: [
    ...businessFields(),
    {
      type: "select",
      name: "noteType",
      label: "Tipo de nota",
      options: [
        { value: "credito", label: "Nota de crédito (devoluciones, descuentos)" },
        { value: "debito", label: "Nota de débito (cargos adicionales)" },
      ],
      section: SECTION_NUMBERING,
      fullWidth: true,
    },
    ...numberingFields(),
    ...fiscalFields(),
    ...linesFields(),
    rateField(),
    ...documentDesignFields(),
  ],
});
