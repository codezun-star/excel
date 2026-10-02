import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { listField, percentField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  stylists: stringList(20, 40).min(1, "Agrega al menos un estilista"),
  commission: z.coerce.number().min(0).max(100),
  rows: rowsCount(50, 10000),
});

export type BarberiaConfig = z.infer<typeof configSchema>;

export const form = defineForm<BarberiaConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    stylists: ["Kevin", "Andrea", "Luis"],
    commission: 40,
    rows: 1500,
  }),
  formFields: [
    nameField("Nombre de la barbería o salón (opcional)"),
    ...periodFields(),
    listField("stylists", "Estilistas o barberos", {
      itemPlaceholder: "Nombre",
      maxItems: 20,
      addLabel: "Agregar estilista",
    }),
    percentField(
      "commission",
      "Comisión predeterminada",
      "Puedes cambiar el porcentaje de cada uno en el archivo.",
    ),
    rowsField("rows", "Filas de servicios", 50, 10000, 50),
    ...ledgerDesignFields(),
  ],
});
