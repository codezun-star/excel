import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { moneyField, rowsField } from "@/templates/shared/register";
import { money, rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  debts: rowsCount(3, 50),
  extra: money,
  method: z.enum(["snowball", "avalanche"]),
});

export type DeudasConfig = z.infer<typeof configSchema>;

export const form = defineForm<DeudasConfig>({
  configSchema,
  defaultConfig: { ...ledgerBaseDefaults, debts: 10, extra: 500, method: "snowball" },
  formFields: [
    nameField("Nombre (opcional)", "Ej. Familia Martínez"),
    rowsField("debts", "Filas de deudas", 3, 50, 1),
    moneyField(
      "extra",
      "Dinero extra al mes para deudas",
      100,
      "Se suma al pago de la deuda que va primero en tu plan.",
    ),
    {
      type: "select",
      name: "method",
      label: "Método de pago",
      options: [
        { value: "snowball", label: "Bola de nieve (primero el menor saldo)" },
        { value: "avalanche", label: "Avalancha (primero la mayor tasa)" },
      ],
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
