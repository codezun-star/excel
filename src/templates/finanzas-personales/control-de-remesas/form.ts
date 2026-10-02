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
import { stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  exchangeRate: z.coerce.number({ error: "Escribe el tipo de cambio" }).min(0.01).max(1000),
  companies: stringList(15, 40),
  uses: stringList(20, 40).min(1),
});

export type RemesasConfig = z.infer<typeof configSchema>;

export const form = defineForm<RemesasConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    exchangeRate: 26.5,
    companies: ["Western Union", "Remesas en banco", "Ria", "MoneyGram", "Transferencia"],
    uses: [
      "Alimentación",
      "Educación",
      "Salud",
      "Vivienda",
      "Servicios",
      "Deudas",
      "Ahorro",
      "Negocio",
      "Otros",
    ],
  }),
  formFields: [
    nameField("Nombre de la familia (opcional)"),
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
      name: "exchangeRate",
      label: "Tipo de cambio de referencia (lempiras por dólar)",
      min: 0.01,
      step: 0.01,
      section: SECTION_CONTENT,
    },
    {
      type: "list",
      name: "companies",
      label: "Empresas de envío",
      maxItems: 15,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "uses",
      label: "Usos del dinero",
      maxItems: 20,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    ...ledgerDesignFields(),
  ],
});
