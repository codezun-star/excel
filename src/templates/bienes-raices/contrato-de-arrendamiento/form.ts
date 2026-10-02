import { z } from "zod";

import { defineForm } from "@/templates/define";
import { SECTION_CONTENT } from "@/templates/shared/fields";
import {
  ledgerBaseDefaults,
  ledgerBaseShape,
  ledgerDesignFields,
  nameField,
} from "@/templates/shared/ledger-form";
import { moneyField, textField } from "@/templates/shared/register";
import { isoDate, money, text } from "@/templates/shared/schema";

export const configSchema = z.object({
  ...ledgerBaseShape,
  landlord: text(80),
  tenant: text(80),
  address: text(160),
  city: text(60),
  use: z.enum(["vivienda", "local comercial", "oficina", "bodega"]),
  rent: money,
  deposit: money,
  months: z.coerce.number().int().min(1).max(60),
  start: isoDate,
  payDay: z.coerce.number().int().min(1).max(28),
  noticeDays: z.coerce.number().int().min(0).max(180),
});

export type ContratoConfig = z.infer<typeof configSchema>;

export const form = defineForm<ContratoConfig>({
  configSchema,
  defaultConfig: () => ({
    ...ledgerBaseDefaults,
    landlord: "",
    tenant: "",
    address: "",
    city: "Tegucigalpa, M.D.C.",
    use: "vivienda",
    rent: 8000,
    deposit: 8000,
    months: 12,
    start: "",
    payDay: 5,
    noticeDays: 30,
  }),
  formFields: [
    nameField("Inmobiliaria o corredor (opcional)", "Ej. Bienes Raíces del Valle"),
    textField("landlord", "Nombre del arrendador (dueño)", "Ej. José Antonio Mejía"),
    textField("tenant", "Nombre del arrendatario (inquilino)", "Ej. Karla Patricia Flores"),
    textField(
      "address",
      "Dirección del inmueble",
      "Ej. Col. Palmira, calle principal, casa 12",
      160,
    ),
    textField("city", "Ciudad donde se firma", "Ej. San Pedro Sula, Cortés", 60),
    {
      type: "select",
      name: "use",
      label: "Uso del inmueble",
      options: [
        { value: "vivienda", label: "Vivienda" },
        { value: "local comercial", label: "Local comercial" },
        { value: "oficina", label: "Oficina" },
        { value: "bodega", label: "Bodega" },
      ],
      section: SECTION_CONTENT,
    },
    moneyField("rent", "Renta mensual", 500),
    moneyField("deposit", "Depósito de garantía", 500),
    {
      type: "number",
      name: "months",
      label: "Plazo en meses",
      min: 1,
      max: 60,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "date",
      name: "start",
      label: "Fecha de inicio",
      section: SECTION_CONTENT,
      description: "Si la dejas vacía se usa el primer día del mes siguiente.",
    },
    {
      type: "number",
      name: "payDay",
      label: "Día límite de pago de cada mes",
      min: 1,
      max: 28,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "number",
      name: "noticeDays",
      label: "Días de aviso para terminar el contrato",
      min: 0,
      max: 180,
      step: 5,
      section: SECTION_CONTENT,
    },
    ...ledgerDesignFields(),
  ],
});
