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
import { listField } from "@/templates/shared/register";
import { stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  services: stringList(30, 40).min(1, "Agrega al menos un servicio"),
});

export type ServiciosConfig = z.infer<typeof configSchema>;

export const form = defineForm<ServiciosConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    services: [
      "Energía eléctrica",
      "Agua",
      "Internet",
      "Teléfono celular",
      "Cable o streaming",
      "Gas",
      "Alquiler",
      "Colegiatura",
    ],
  }),
  formFields: [
    nameField("Nombre del hogar (opcional)", "Ej. Casa de la familia Reyes"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    listField("services", "Servicios", {
      itemPlaceholder: "Ej. Seguridad del barrio",
      maxItems: 30,
      addLabel: "Agregar servicio",
    }),
    ...ledgerDesignFields(),
  ],
});
