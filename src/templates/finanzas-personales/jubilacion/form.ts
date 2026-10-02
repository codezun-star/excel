import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
} from "@/templates/shared/ledger-form";
import { moneyField, percentField } from "@/templates/shared/register";
import { money } from "@/templates/shared/schema";

const pct = z.coerce.number().min(0).max(100);
const age = z.coerce.number().int().min(15).max(90);

export const configSchema = z
  .object({
    ...ledgerBaseShape,
    age,
    retireAge: age,
    retireYears: z.coerce.number().int().min(1).max(50),
    savings: money,
    monthly: money,
    increase: pct,
    returnRate: pct,
    inflation: pct,
  })
  .refine((c) => c.retireAge > c.age, {
    message: "La edad de retiro debe ser mayor a tu edad",
    path: ["retireAge"],
  });

export type JubilacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<JubilacionConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    age: 30,
    retireAge: 62,
    retireYears: 20,
    savings: 20000,
    monthly: 1500,
    increase: 3,
    returnRate: 7,
    inflation: 4,
  },
  formFields: [
    {
      type: "number",
      name: "age",
      label: "Tu edad actual",
      min: 15,
      max: 90,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "retireAge",
      label: "Edad a la que te quieres retirar",
      min: 16,
      max: 90,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "retireYears",
      label: "Años de retiro a cubrir",
      min: 1,
      max: 50,
      step: 1,
      section: SECTION_CONTENT,
    },
    moneyField("savings", "Ahorro que ya tienes para el retiro", 1000),
    moneyField("monthly", "Aporte mensual", 100),
    percentField("increase", "Aumento anual de tu aporte"),
    percentField("returnRate", "Rendimiento anual esperado"),
    percentField("inflation", "Inflación anual estimada"),
    ...ledgerDesignFields(),
  ],
});
