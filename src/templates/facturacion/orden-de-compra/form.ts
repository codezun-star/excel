import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  businessFields,
  documentBaseDefaults,
  documentBaseShape,
  documentDesignFields,
  linesFields,
  numberingFields,
  rateField,
  taxShape,
} from "@/templates/shared/document-form";
import { text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...documentBaseShape,
  ...taxShape,
  deliveryPlace: text(100),
});

export type OrdenCompraConfig = z.infer<typeof configSchema>;

export const form = defineForm<OrdenCompraConfig>({
  configSchema,
  defaultConfig: (ctx) => ({
    ...documentBaseDefaults(ctx),
    prefix: "OC-",
    includeTax: true,
    defaultRate: "standard",
    deliveryPlace: "Bodega principal",
    notes: "Favor indicar el número de esta orden en su factura.",
  }),
  formFields: [
    ...businessFields(),
    ...numberingFields({ section: "Numeración" }),
    {
      type: "text",
      name: "deliveryPlace",
      label: "Lugar de entrega",
      maxLength: 100,
      section: "Numeración",
    },
    ...linesFields(),
    { type: "switch", name: "includeTax", label: "Incluir ISV", section: SECTION_CONTENT },
    rateField({ showWhenTax: true }),
    ...documentDesignFields(),
  ],
});
