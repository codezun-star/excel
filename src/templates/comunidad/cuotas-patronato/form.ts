import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  currentYear,
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
  yearSchema,
} from "@/templates/shared/ledger-form";
import { money, rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  fee: money,
  members: rowsCount(5, 2000),
  openingBalance: money,
});

export type PatronatoConfig = z.infer<typeof configSchema>;

export const form = defineForm<PatronatoConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    fee: 100,
    members: 80,
    openingBalance: 0,
  }),
  formFields: [
    nameField("Nombre del patronato o junta", "Ej. Patronato Colonia Kennedy"),
    {
      type: "number",
      name: "year",
      label: "Año",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "fee",
      label: "Cuota mensual",
      min: 0,
      step: 10,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "members",
      label: "Cantidad de viviendas o familias",
      min: 5,
      max: 2000,
      step: 5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "openingBalance",
      label: "Saldo en caja al iniciar el año",
      min: 0,
      step: 100,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
