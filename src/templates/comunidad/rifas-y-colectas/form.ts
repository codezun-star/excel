import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { listField, moneyField, rowsField, textField } from "@/templates/shared/register";
import { money, rowsCount, stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  prize: text(80),
  ticketPrice: money,
  tickets: rowsCount(10, 5000),
  firstNumber: z.enum(["0", "1"]),
  goal: money,
  sellers: stringList(40, 40).min(1),
  donations: rowsCount(10, 2000),
  expenses: rowsCount(10, 500),
});

export type RifaConfig = z.infer<typeof configSchema>;

export const form = defineForm<RifaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    prize: "Motocicleta 125 cc",
    ticketPrice: 50,
    tickets: 100,
    firstNumber: "0",
    goal: 10000,
    sellers: ["María", "Carlos", "Ana", "Luis"],
    donations: 50,
    expenses: 30,
  }),
  formFields: [
    nameField("Nombre de la actividad", "Ej. Rifa pro construcción del templo"),
    textField("prize", "Premio", "Ej. Pantalla de 55 pulgadas"),
    moneyField("ticketPrice", "Precio por boleto", 5),
    rowsField(
      "tickets",
      "Cantidad de boletos",
      10,
      5000,
      10,
      "Para rifas con la lotería usa 100 (del 00 al 99).",
    ),
    {
      type: "select",
      name: "firstNumber",
      label: "Numeración",
      options: [
        { value: "0", label: "Empieza en 0 (00, 01, 02…)" },
        { value: "1", label: "Empieza en 1 (1, 2, 3…)" },
      ],
      section: SECTION_CONTENT,
    },
    moneyField("goal", "Meta a recaudar", 500),
    listField("sellers", "Vendedores", { itemPlaceholder: "Nombre", maxItems: 40 }),
    rowsField("donations", "Filas de donaciones", 10, 2000, 10),
    rowsField("expenses", "Filas de gastos", 10, 500, 10),
    ...ledgerDesignFields(),
  ],
});
