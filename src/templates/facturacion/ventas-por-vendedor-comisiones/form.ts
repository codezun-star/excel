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
import { money, rowsCount, stringList } from "@/templates/shared/schema";

const percent = z.coerce.number({ error: "Escribe un porcentaje" }).min(0).max(100);

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  sellers: stringList(40, 40).min(1, "Agrega al menos un vendedor"),
  monthlyGoal: money,
  baseRate: percent,
  bonusRate: percent,
  rows: rowsCount(50, 5000),
});

export type ComisionesConfig = z.infer<typeof configSchema>;

export const form = defineForm<ComisionesConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    sellers: ["Ana Martínez", "Carlos Reyes", "Lucía Hernández"],
    monthlyGoal: 60000,
    baseRate: 3,
    bonusRate: 5,
    rows: 600,
  }),
  formFields: [
    nameField(),
    ...periodFields(),
    {
      type: "list",
      name: "sellers",
      label: "Vendedores",
      maxItems: 40,
      addLabel: "Agregar vendedor",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "number",
      name: "monthlyGoal",
      label: "Meta mensual por vendedor",
      min: 0,
      step: 1000,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "baseRate",
      label: "Comisión base",
      suffix: "%",
      min: 0,
      max: 100,
      step: 0.5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "bonusRate",
      label: "Comisión al cumplir la meta",
      suffix: "%",
      min: 0,
      max: 100,
      step: 0.5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "rows",
      label: "Filas de ventas",
      min: 50,
      max: 5000,
      step: 50,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
