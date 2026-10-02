import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
} from "@/templates/shared/ledger-form";
import { listField, moneyField, rowsField, textField } from "@/templates/shared/register";
import { isoDate, money, rowsCount, stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  eventName: text(80),
  eventDate: isoDate,
  budget: money,
  categories: stringList(30, 40).min(1, "Agrega al menos un rubro"),
  items: rowsCount(10, 300),
  guests: rowsCount(20, 2000),
});

export type EventoConfig = z.infer<typeof configSchema>;

export const form = defineForm<EventoConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    eventName: "Nuestra boda",
    eventDate: "",
    budget: 150000,
    categories: [
      "Lugar o salón",
      "Comida y bebida",
      "Pastel",
      "Decoración y flores",
      "Música",
      "Fotografía y video",
      "Vestuario",
      "Invitaciones",
      "Transporte",
      "Iglesia o ceremonia",
      "Otros",
    ],
    items: 40,
    guests: 200,
  },
  formFields: [
    textField("eventName", "Nombre del evento", "Ej. Boda de Ana y Luis"),
    { type: "date", name: "eventDate", label: "Fecha del evento", section: SECTION_CONTENT },
    moneyField("budget", "Presupuesto total", 5000),
    listField("categories", "Rubros", {
      itemPlaceholder: "Ej. Recuerdos",
      maxItems: 30,
      addLabel: "Agregar rubro",
    }),
    rowsField("items", "Filas de proveedores y gastos", 10, 300, 5),
    rowsField("guests", "Filas de invitados", 20, 2000, 10),
    ...ledgerDesignFields(),
  ],
});
