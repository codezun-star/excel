import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  include: z.array(z.enum(["cobrar", "pagar"])).min(1, "Elige al menos una opción"),
  creditDays: z.coerce.number({ error: "Escribe un número" }).int().min(0).max(365),
  rows: rowsCount(20, 2000),
  paymentMethods: stringList(10, 30),
});

export type CuentasConfig = z.infer<typeof configSchema>;

export const form = defineForm<CuentasConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    include: ["cobrar", "pagar"],
    creditDays: 30,
    rows: 200,
    paymentMethods: ["Efectivo", "Transferencia", "Cheque", "Depósito"],
  },
  formFields: [
    nameField(),
    {
      type: "multiselect",
      name: "include",
      label: "Incluir",
      options: [
        { value: "cobrar", label: "Cuentas por cobrar (clientes)" },
        { value: "pagar", label: "Cuentas por pagar (proveedores)" },
      ],
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "creditDays",
      label: "Días de crédito predeterminados",
      min: 0,
      max: 365,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas por hoja",
      min: 20,
      max: 2000,
      step: 10,
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
    ...ledgerDesignFields(),
  ],
});
