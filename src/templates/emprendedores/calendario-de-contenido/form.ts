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
import { listField, rowsField } from "@/templates/shared/register";
import { rowsCount, stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  networks: stringList(10, 30).min(1),
  pillars: stringList(12, 40).min(1),
  rows: rowsCount(30, 5000),
});

export type ContenidoConfig = z.infer<typeof configSchema>;

export const form = defineForm<ContenidoConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    networks: ["Facebook", "Instagram", "TikTok", "WhatsApp Estados"],
    pillars: ["Promoción", "Educativo", "Testimonios", "Detrás de cámaras", "Entretenimiento"],
    rows: 500,
  }),
  formFields: [
    nameField("Marca o negocio", "Ej. Boutique Lucía"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    listField("networks", "Redes sociales", { itemPlaceholder: "Ej. YouTube", maxItems: 10 }),
    listField("pillars", "Temas o pilares de contenido", {
      itemPlaceholder: "Ej. Lanzamientos",
      maxItems: 12,
    }),
    rowsField("rows", "Filas de publicaciones", 30, 5000, 10),
    ...ledgerDesignFields(),
  ],
});
