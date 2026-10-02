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
  fee: money,
  enrollment: money,
  opening: money,
  members: rowsCount(5, 2000),
  expenseCategories: stringList(20, 40).min(1),
});

export type AsociacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<AsociacionConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    fee: 200,
    enrollment: 500,
    opening: 0,
    members: 60,
    expenseCategories: [
      "Reuniones y asambleas",
      "Papelería",
      "Ayudas a socios",
      "Eventos",
      "Trámites legales",
      "Transporte",
      "Otros",
    ],
  }),
  formFields: [
    nameField("Nombre de la asociación", "Ej. Asociación de Productores de Café de Marcala"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    moneyField("fee", "Cuota mensual por socio", 10),
    moneyField(
      "enrollment",
      "Cuota de inscripción (una vez)",
      50,
      "Escribe 0 si no cobran inscripción.",
    ),
    moneyField("opening", "Saldo inicial", 100),
    rowsField("members", "Cantidad de socios", 5, 2000, 5),
    listField("expenseCategories", "Categorías de gasto", {
      itemPlaceholder: "Ej. Capacitaciones",
      maxItems: 20,
    }),
    ...ledgerDesignFields(),
  ],
});
