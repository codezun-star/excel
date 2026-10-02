import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { money, rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  clients: rowsCount(10, 1000),
  movements: rowsCount(50, 10000),
  defaultLimit: money,
});

export type FiadosConfig = z.infer<typeof configSchema>;

export const form = defineForm<FiadosConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, clients: 100, movements: 1000, defaultLimit: 1000 },
  formFields: [
    nameField("Nombre de la pulpería o negocio"),
    {
      type: "number",
      name: "clients",
      label: "Filas de clientes",
      min: 10,
      max: 1000,
      step: 10,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "movements",
      label: "Filas de movimientos",
      min: 50,
      max: 10000,
      step: 50,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "defaultLimit",
      label: "Límite de crédito predeterminado",
      min: 0,
      step: 100,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
