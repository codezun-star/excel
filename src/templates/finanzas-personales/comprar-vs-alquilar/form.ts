import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
} from "@/templates/shared/ledger-form";
import { moneyField, percentField } from "@/templates/shared/register";
import { money } from "@/templates/shared/schema";

const pct = z.coerce.number().min(0).max(100);

export const configSchema = z.object({
  ...ledgerBaseShape,
  price: money,
  downPct: pct,
  rate: pct,
  years: z.coerce.number().int().min(1).max(30),
  ownCostsPct: pct,
  appreciation: z.coerce.number().min(-20).max(30),
  rent: money,
  rentIncrease: pct,
  investReturn: pct,
});

export type ComprarConfig = z.infer<typeof configSchema>;

export const form = defineForm<ComprarConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    price: 1_800_000,
    downPct: 10,
    rate: 11,
    years: 20,
    ownCostsPct: 1.5,
    appreciation: 3,
    rent: 10_000,
    rentIncrease: 5,
    investReturn: 7,
  },
  formFields: [
    moneyField("price", "Precio de la vivienda", 10000),
    percentField("downPct", "Prima"),
    percentField("rate", "Tasa de interés anual del préstamo"),
    {
      type: "number",
      name: "years",
      label: "Plazo del préstamo",
      min: 1,
      max: 30,
      step: 1,
      suffix: "años",
      section: SECTION_CONTENT,
    },
    percentField(
      "ownCostsPct",
      "Seguros, mantenimiento e impuestos al año",
      "Porcentaje del valor de la vivienda.",
    ),
    {
      type: "number",
      name: "appreciation",
      label: "Plusvalía anual",
      min: -20,
      max: 30,
      step: 0.5,
      suffix: "%",
      section: SECTION_CONTENT,
    },
    moneyField("rent", "Alquiler mensual de una vivienda similar", 500),
    percentField("rentIncrease", "Aumento anual del alquiler"),
    percentField("investReturn", "Rendimiento anual si inviertes el dinero"),
    ...ledgerDesignFields(),
  ],
});
