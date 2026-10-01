import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT, businessFields, paperField } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
} from "@/templates/shared/ledger-form";
import { paper, stringList, taxIdText, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  taxId: taxIdText,
  address: text(120),
  phone: text(40),
  email: text(80),
  prefix: text(20),
  startNumber: z.coerce.number({ error: "Escribe un número" }).int().min(1).max(9_999_999),
  count: z.coerce.number({ error: "Escribe un número" }).int().min(1).max(60),
  paymentMethods: stringList(10, 30),
  paper,
});

export type ReciboConfig = z.infer<typeof configSchema>;

export const form = defineForm<ReciboConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    taxId: "",
    address: "",
    phone: "",
    email: "",
    prefix: "R-",
    startNumber: 1,
    count: 12,
    paymentMethods: ["Efectivo", "Transferencia", "Cheque", "Depósito"],
    paper: "letter",
  },
  formFields: [
    ...businessFields({ logo: false }),
    { type: "text", name: "prefix", label: "Prefijo", maxLength: 20, section: SECTION_CONTENT },
    {
      type: "number",
      name: "startNumber",
      label: "Primer número",
      min: 1,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "count",
      label: "Cantidad de recibos",
      min: 1,
      max: 60,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "paymentMethods",
      label: "Formas de pago",
      maxItems: 10,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    paperField,
    ...ledgerDesignFields(),
  ],
});
