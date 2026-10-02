import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import { listField, rowsField, textField } from "@/templates/shared/register";
import { rowsCount, stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  crop: text(40),
  season: text(40),
  area: z.coerce.number().min(0.01).max(100000),
  unit: text(20),
  activities: stringList(25, 40).min(1, "Agrega al menos una actividad"),
  costs: rowsCount(20, 5000),
  sales: rowsCount(10, 3000),
});

export type AgroConfig = z.infer<typeof configSchema>;

export const form = defineForm<AgroConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    crop: "Café",
    season: `Cosecha ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    area: 5,
    unit: "Quintal",
    activities: [
      "Preparación de tierra",
      "Siembra y resiembra",
      "Fertilización",
      "Control de plagas y enfermedades",
      "Limpias y chapias",
      "Corte o cosecha",
      "Beneficiado y secado",
      "Transporte",
      "Otros",
    ],
    costs: 400,
    sales: 100,
  },
  formFields: [
    nameField("Nombre de la finca (opcional)", "Ej. Finca El Mirador"),
    textField("crop", "Cultivo o actividad", "Ej. Café, Maíz, Frijol, Ganado lechero", 40),
    textField("season", "Temporada", "Ej. Cosecha 2026-2027", 40),
    {
      type: "number",
      name: "area",
      label: "Área sembrada",
      min: 0.01,
      step: 0.25,
      suffix: "mz",
      section: SECTION_CONTENT,
    },
    textField("unit", "Unidad de producción", "Ej. Quintal, Lata, Carga, Litro", 20),
    listField("activities", "Actividades de costo", {
      itemPlaceholder: "Ej. Riego",
      maxItems: 25,
      addLabel: "Agregar actividad",
    }),
    rowsField("costs", "Filas de costos", 20, 5000, 20),
    rowsField("sales", "Filas de cosecha y ventas", 10, 3000, 10),
    ...ledgerDesignFields(),
  ],
});
