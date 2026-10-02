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
import { listField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  sellers: stringList(20, 40).min(1),
  sources: stringList(15, 30).min(1),
  staleDays: z.coerce.number().int().min(1).max(90),
  leads: rowsCount(20, 5000),
});

export type CrmConfig = z.infer<typeof configSchema>;

export const form = defineForm<CrmConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    sellers: ["Yo"],
    sources: [
      "Facebook",
      "Instagram",
      "WhatsApp",
      "Referido",
      "Visita al local",
      "Llamada",
      "Página web",
    ],
    staleDays: 7,
    leads: 500,
  }),
  formFields: [
    nameField("Negocio", "Ej. Seguros y Fianzas Castro"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    listField("sellers", "Vendedores", { itemPlaceholder: "Ej. Andrea", maxItems: 20 }),
    listField("sources", "¿De dónde llegan los clientes?", {
      itemPlaceholder: "Ej. Feria",
      maxItems: 15,
    }),
    {
      type: "number",
      name: "staleDays",
      label: "Avisar si un cliente lleva estos días sin contacto",
      min: 1,
      max: 90,
      step: 1,
      section: SECTION_CONTENT,
    },
    rowsField("leads", "Filas de clientes", 20, 5000, 20),
    ...ledgerDesignFields(),
  ],
});
