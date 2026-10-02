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
import { listField, moneyField, rowsField } from "@/templates/shared/register";
import { money, rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  professionals: stringList(20, 40).min(1),
  price: money,
  patients: rowsCount(20, 10000),
  appointments: rowsCount(50, 20000),
});

export type CitasConfig = z.infer<typeof configSchema>;

export const form = defineForm<CitasConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    professionals: ["Dra. Mejía", "Dr. Castro"],
    price: 600,
    patients: 500,
    appointments: 2000,
  }),
  formFields: [
    nameField("Nombre de la clínica o consultorio", "Ej. Clínica Dental Sonrisas"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    listField("professionals", "Profesionales", {
      itemPlaceholder: "Ej. Lic. Fuentes",
      maxItems: 20,
    }),
    moneyField("price", "Precio habitual de la consulta", 50),
    rowsField("patients", "Filas de pacientes", 20, 10000, 20),
    rowsField("appointments", "Filas de citas", 50, 20000, 50),
    ...ledgerDesignFields(),
  ],
});
