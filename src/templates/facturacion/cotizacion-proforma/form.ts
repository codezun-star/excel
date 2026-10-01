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
import { stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...documentBaseShape,
  ...taxShape,
  documentTitle: z.enum(["COTIZACIÓN", "FACTURA PROFORMA"]),
  validityDays: z.coerce.number({ error: "Escribe un número" }).int().min(1).max(365),
  deliveryTime: text(60),
  terms: stringList(10, 160),
});

export type CotizacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<CotizacionConfig>({
  configSchema,
  defaultConfig: (ctx) => ({
    ...documentBaseDefaults(ctx),
    prefix: "COT-",
    includeTax: true,
    defaultRate: "standard",
    documentTitle: "COTIZACIÓN",
    validityDays: 15,
    deliveryTime: "Inmediata",
    terms: [
      "Precios en lempiras, sujetos a cambio sin previo aviso después de la fecha de vigencia.",
      "Forma de pago: 50 % de anticipo y 50 % contra entrega.",
    ],
  }),
  formFields: [
    ...businessFields(),
    {
      type: "select",
      name: "documentTitle",
      label: "Tipo de documento",
      options: [
        { value: "COTIZACIÓN", label: "Cotización" },
        { value: "FACTURA PROFORMA", label: "Factura proforma" },
      ],
      section: "Numeración",
    },
    ...numberingFields({ section: "Numeración" }),
    {
      type: "number",
      name: "validityDays",
      label: "Días de vigencia",
      min: 1,
      max: 365,
      step: 1,
      section: "Numeración",
    },
    {
      type: "text",
      name: "deliveryTime",
      label: "Tiempo de entrega",
      placeholder: "Ej. 5 días hábiles",
      maxLength: 60,
      section: "Numeración",
    },
    ...linesFields(),
    {
      type: "switch",
      name: "includeTax",
      label: "Incluir ISV",
      description: "Desactívalo si tus precios ya incluyen impuestos o no aplican.",
      section: SECTION_CONTENT,
    },
    rateField({ showWhenTax: true }),
    {
      type: "list",
      name: "terms",
      label: "Condiciones comerciales",
      itemPlaceholder: "Ej. Garantía de 6 meses",
      maxItems: 10,
      addLabel: "Agregar condición",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    ...documentDesignFields(),
  ],
});
