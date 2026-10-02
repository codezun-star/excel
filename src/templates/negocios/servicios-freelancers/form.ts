import { z } from "zod";

import { defineForm } from "@/templates/define";
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
  projects: rowsCount(10, 1000),
  hours: rowsCount(50, 20000),
  movements: rowsCount(20, 5000),
  clients: rowsCount(5, 500),
  defaultRate: money,
});

export type FreelanceConfig = z.infer<typeof configSchema>;

export const form = defineForm<FreelanceConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    projects: 100,
    hours: 2000,
    movements: 500,
    clients: 50,
    defaultRate: 500,
  },
  formFields: [
    nameField("Tu nombre o el de tu negocio (opcional)"),
    moneyField("defaultRate", "Tarifa por hora predeterminada", 50),
    rowsField("projects", "Filas de proyectos", 10, 1000, 10),
    rowsField("hours", "Filas de horas", 50, 20000, 50),
    rowsField("movements", "Filas de pagos y gastos", 20, 5000, 20),
    rowsField("clients", "Filas de clientes", 5, 500, 5),
    ...ledgerDesignFields(),
  ],
});
