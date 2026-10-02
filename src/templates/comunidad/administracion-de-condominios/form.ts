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
import { listField, moneyField, percentField, rowsField } from "@/templates/shared/register";
import { money, rowsCount, stringList } from "@/templates/shared/schema";

const percent = z.coerce.number().min(0).max(100);

export const configSchema = z.object({
  ...ledgerBaseShape,
  year: yearSchema,
  units: rowsCount(4, 2000),
  feeMode: z.enum(["share", "fixed"]),
  fixedFee: money,
  reserve: percent,
  lateFee: percent,
  opening: money,
  expenseCategories: stringList(25, 40).min(1),
});

export type CondominioConfig = z.infer<typeof configSchema>;

export const form = defineForm<CondominioConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    year: currentYear(),
    units: 40,
    feeMode: "share",
    fixedFee: 800,
    reserve: 10,
    lateFee: 5,
    opening: 0,
    expenseCategories: [
      "Vigilancia",
      "Limpieza",
      "Energía de áreas comunes",
      "Agua",
      "Jardinería",
      "Mantenimiento",
      "Administración",
      "Seguros",
      "Otros",
    ],
  }),
  formFields: [
    nameField("Nombre del residencial o condominio", "Ej. Residencial Los Pinos"),
    { type: "number", name: "year", label: "Año", min: 2000, max: 2100, section: SECTION_CONTENT },
    rowsField("units", "Cantidad de unidades (casas, apartamentos o locales)", 4, 2000, 1),
    {
      type: "select",
      name: "feeMode",
      label: "Cómo se calcula la cuota",
      options: [
        { value: "share", label: "Por alícuota (según el área de cada unidad)" },
        { value: "fixed", label: "Cuota fija igual para todos" },
      ],
      section: SECTION_CONTENT,
    },
    moneyField("fixedFee", "Cuota fija mensual", 50, "Solo se usa si eliges cuota fija."),
    percentField(
      "reserve",
      "Fondo de reserva sobre el presupuesto",
      "Porcentaje que se aparta para reparaciones mayores.",
      50,
    ),
    percentField(
      "lateFee",
      "Recargo por mora",
      "Porcentaje sobre el saldo vencido según el reglamento.",
      50,
    ),
    moneyField("opening", "Saldo inicial en caja", 100),
    listField("expenseCategories", "Categorías de gastos comunes", {
      itemPlaceholder: "Ej. Portón eléctrico",
      maxItems: 25,
    }),
    ...ledgerDesignFields(),
  ],
});
