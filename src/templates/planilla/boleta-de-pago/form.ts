import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { rowsCount } from "@/templates/shared/schema";

import { payrollFields, payrollShape } from "../shared/form";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  ...payrollShape,
  rows: rowsCount(1, 200),
});

export type BoletaConfig = z.infer<typeof configSchema>;

export const form = defineForm<BoletaConfig>({
  configSchema,
  defaultConfig: (ctx) => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    taxId: "",
    socialSecurity: ctx.taxes.socialSecurity.filter((s) => s.employeeRate > 0).map((s) => s.id),
    includeIncomeTax: true,
    rows: 10,
  }),
  formFields: [
    nameField("Nombre de la empresa"),
    ...payrollFields(),
    ...periodFields(),
    {
      type: "number",
      name: "rows",
      label: "Cantidad de boletas (empleados)",
      min: 1,
      max: 200,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
