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
  contribution: money,
  monthlyRate: z.coerce.number().min(0).max(20),
  members: rowsCount(5, 500),
});

export type CajaRuralConfig = z.infer<typeof configSchema>;

export const form = defineForm<CajaRuralConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    contribution: 200,
    monthlyRate: 2,
    members: 30,
  }),
  formFields: [
    nameField("Nombre de la caja o grupo", "Ej. Caja Rural El Progreso"),
    {
      type: "number",
      name: "year",
      label: "Año o ciclo",
      min: 2000,
      max: 2100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "contribution",
      label: "Aporte mensual por socio",
      min: 0,
      step: 10,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "monthlyRate",
      label: "Interés mensual de los préstamos",
      suffix: "%",
      min: 0,
      max: 20,
      step: 0.5,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "members",
      label: "Cantidad de socios",
      min: 5,
      max: 500,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
