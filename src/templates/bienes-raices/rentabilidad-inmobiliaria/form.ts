import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { moneyField, percentField, textField } from "@/templates/shared/register";
import { money, text } from "@/templates/shared/schema";

const percent = z.coerce.number().min(0).max(100);

export const configSchema = z.object({
  ...ledgerBaseShape,
  property: text(80),
  price: money,
  downPayment: percent,
  rate: percent,
  termYears: z.coerce.number().int().min(1).max(40),
  rent: money,
  vacancy: percent,
  years: z.coerce.number().int().min(1).max(30),
});

export type RentabilidadConfig = z.infer<typeof configSchema>;

export const form = defineForm<RentabilidadConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    property: "Apartamento de 2 habitaciones",
    price: 2200000,
    downPayment: 20,
    rate: 11,
    termYears: 20,
    rent: 15000,
    vacancy: 8,
    years: 10,
  }),
  formFields: [
    nameField("Inversionista o empresa (opcional)", "Ej. Inversiones Rivera"),
    textField("property", "Propiedad a evaluar", "Ej. Casa en Res. Las Uvas"),
    moneyField("price", "Precio de compra", 50000),
    percentField("downPayment", "Prima o enganche", "Porcentaje del precio que pagas de contado."),
    percentField("rate", "Tasa de interés anual del préstamo", undefined, 40),
    {
      type: "number",
      name: "termYears",
      label: "Plazo del préstamo (años)",
      min: 1,
      max: 40,
      step: 1,
      section: SECTION_CONTENT,
    },
    moneyField("rent", "Renta mensual esperada", 500),
    percentField(
      "vacancy",
      "Vacancia (tiempo sin inquilino)",
      "Porcentaje del año que la propiedad estaría vacía.",
      50,
    ),
    {
      type: "number",
      name: "years",
      label: "Años de análisis",
      min: 1,
      max: 30,
      step: 1,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
