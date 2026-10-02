import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { periodDefaults, periodFields, periodShape } from "@/templates/shared/period";
import { stringList } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  ...periodShape,
  incomes: stringList(15, 40).min(1),
  categories: stringList(40, 40).min(1),
});

export type PresupuestoMensualConfig = z.infer<typeof configSchema>;

export const form = defineForm<PresupuestoMensualConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    ...periodDefaults(),
    incomes: ["Salario", "Remesas", "Negocio o trabajos extra"],
    categories: [
      "Alimentación",
      "Vivienda (alquiler o cuota)",
      "Energía eléctrica",
      "Agua",
      "Internet y teléfono",
      "Transporte y combustible",
      "Educación",
      "Salud",
      "Deudas y tarjetas",
      "Ropa y calzado",
      "Entretenimiento",
      "Ahorro",
      "Otros",
    ],
  }),
  formFields: [
    nameField("Nombre de la familia o persona (opcional)", "Ej. Familia López"),
    ...periodFields(),
    {
      type: "list",
      name: "incomes",
      label: "Fuentes de ingreso",
      maxItems: 15,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "categories",
      label: "Categorías de gasto",
      maxItems: 40,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    ...ledgerDesignFields(),
  ],
});
