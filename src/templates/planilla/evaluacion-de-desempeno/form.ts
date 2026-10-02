import { z } from "zod";

import { defineForm } from "@/templates/define";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { listField, rowsField, textField } from "@/templates/shared/register";
import { rowsCount, stringList, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  period: text(60),
  competencies: stringList(10, 40).min(2, "Agrega al menos 2 competencias"),
  employees: rowsCount(3, 300),
});

export type EvaluacionConfig = z.infer<typeof configSchema>;

export const form = defineForm<EvaluacionConfig>({
  configSchema,
  defaultConfig: {
    ...ledgerBaseDefaults,
    period: `Año ${new Date().getFullYear()}`,
    competencies: [
      "Calidad del trabajo",
      "Productividad",
      "Puntualidad y asistencia",
      "Trabajo en equipo",
      "Atención al cliente",
      "Iniciativa",
    ],
    employees: 30,
  },
  formFields: [
    nameField("Nombre de la empresa (opcional)"),
    textField("period", "Período evaluado", "Ej. Primer semestre 2026", 60),
    listField("competencies", "Competencias a evaluar", {
      itemPlaceholder: "Ej. Comunicación",
      maxItems: 10,
      addLabel: "Agregar competencia",
      description: "Entre 2 y 10. Los pesos se ajustan en el archivo (por defecto, iguales).",
    }),
    rowsField("employees", "Filas de empleados", 3, 300, 1),
    ...ledgerDesignFields(),
  ],
});
