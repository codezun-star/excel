import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { listField, percentField, rowsField, textField } from "@/templates/shared/register";
import { rowsCount, stringList, text } from "@/templates/shared/schema";

const pct = z.coerce.number().min(0).max(100);

export const configSchema = z.object({
  ...ledgerBaseShape,
  project: text(100),
  client: text(80),
  chapters: stringList(25, 40).min(1, "Agrega al menos un capítulo"),
  rows: rowsCount(10, 2000),
  admin: pct,
  contingency: pct,
  profit: pct,
});

export type ObraConfig = z.infer<typeof configSchema>;

export const form = defineForm<ObraConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    project: "Construcción de vivienda",
    client: "",
    chapters: [
      "Preliminares",
      "Cimentación",
      "Estructura",
      "Paredes",
      "Techo",
      "Instalaciones",
      "Acabados",
    ],
    rows: 150,
    admin: 8,
    contingency: 5,
    profit: 10,
  },
  formFields: [
    nameField("Nombre de la constructora (opcional)"),
    textField("project", "Proyecto", "Ej. Vivienda de dos plantas", 100),
    textField("client", "Cliente", "Ej. Familia Rodríguez"),
    listField("chapters", "Capítulos de la obra", {
      itemPlaceholder: "Ej. Obras exteriores",
      maxItems: 25,
      addLabel: "Agregar capítulo",
    }),
    rowsField("rows", "Filas de renglones", 10, 2000, 10),
    percentField("admin", "Administración e indirectos"),
    percentField("contingency", "Imprevistos"),
    percentField("profit", "Utilidad"),
    ...ledgerDesignFields(),
  ],
});
