import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { moneyField, percentField, rowsField } from "@/templates/shared/register";
import { money, rowsCount } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  sellers: rowsCount(3, 200),
  bonusThreshold: z.coerce.number().min(0).max(300),
  bonusAmount: money,
  extraRate: z.coerce.number().min(0).max(100),
});

export type ComisionesConfig = z.infer<typeof configSchema>;

export const form = defineForm<ComisionesConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    sellers: 20,
    bonusThreshold: 100,
    bonusAmount: 1000,
    extraRate: 1,
  }),
  formFields: [
    nameField("Nombre de la empresa (opcional)"),
    ...periodFields(),
    rowsField("sellers", "Filas de vendedores", 3, 200, 1),
    percentField(
      "bonusThreshold",
      "Cumplimiento mínimo para el bono",
      "Porcentaje de la meta que se debe alcanzar para ganar el bono.",
      300,
    ),
    moneyField("bonusAmount", "Monto del bono"),
    percentField(
      "extraRate",
      "Comisión extra sobre lo vendido por encima de la meta",
      "Ponlo en 0 si no la usas.",
    ),
    ...ledgerDesignFields(),
  ],
});
