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
import { listField, percentField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  platforms: stringList(12, 30).min(1),
  margin: z.coerce.number().min(0).max(100),
  rows: rowsCount(50, 10000),
});

export type CampanasConfig = z.infer<typeof configSchema>;

export const form = defineForm<CampanasConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    platforms: ["Facebook e Instagram", "TikTok", "Google", "Influencer", "Volantes", "Radio"],
    margin: 40,
    rows: 1000,
  }),
  formFields: [
    nameField("Negocio o cliente", "Ej. Ferretería La Económica"),
    {
      type: "number",
      name: "year",
      label: "Año del resumen",
      min: 2000,
      max: 2100,
      section: SECTION_CONTENT,
    },
    listField("platforms", "Plataformas o medios", {
      itemPlaceholder: "Ej. YouTube",
      maxItems: 12,
    }),
    percentField(
      "margin",
      "Margen bruto de lo que vendes",
      "Porcentaje de cada venta que te queda después del costo del producto.",
    ),
    rowsField("rows", "Filas del registro de resultados", 50, 10000, 50),
    ...ledgerDesignFields(),
  ],
});
