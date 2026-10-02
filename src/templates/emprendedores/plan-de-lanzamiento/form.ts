import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { textField } from "@/templates/shared/register";
import { isoDate, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  product: text(80),
  launch: isoDate,
});

export type LanzamientoConfig = z.infer<typeof configSchema>;

export const form = defineForm<LanzamientoConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    product: "",
    launch: "",
  }),
  formFields: [
    nameField("Negocio", "Ej. Repostería Dulce Hogar"),
    textField("product", "¿Qué vas a lanzar?", "Ej. Nueva línea de pasteles sin azúcar"),
    {
      type: "date",
      name: "launch",
      label: "Fecha del lanzamiento",
      section: SECTION_CONTENT,
      description: "Si la dejas vacía se usa dentro de 45 días.",
    },
    ...ledgerDesignFields(),
  ],
});
