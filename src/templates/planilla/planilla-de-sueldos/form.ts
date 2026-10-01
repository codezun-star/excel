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
  rows: rowsCount(5, 500),
  biweekly: z.boolean(),
  employerSheet: z.boolean(),
});

export type PlanillaConfig = z.infer<typeof configSchema>;

export const form = defineForm<PlanillaConfig>({
  configSchema,
  defaultConfig: (ctx) => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    taxId: "",
    socialSecurity: ctx.taxes.socialSecurity.filter((s) => s.employeeRate > 0).map((s) => s.id),
    includeIncomeTax: true,
    rows: 25,
    biweekly: false,
    employerSheet: true,
  }),
  formFields: [
    nameField("Nombre de la empresa"),
    ...payrollFields(),
    ...periodFields(),
    {
      type: "number",
      name: "rows",
      label: "Cantidad de empleados (filas)",
      min: 5,
      max: 500,
      step: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "switch",
      name: "biweekly",
      label: "Mostrar pago por quincena",
      section: SECTION_CONTENT,
    },
    {
      type: "switch",
      name: "employerSheet",
      label: "Incluir hoja de aportes patronales",
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
