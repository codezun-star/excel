import { z } from "zod";

import { BRAND_HEX } from "@/lib/excel/styles";

import type { FormFieldDef } from "../types";
import { SECTION_BUSINESS, SECTION_DESIGN, colorField, exampleField } from "./fields";
import { hexColor, text } from "./schema";

/** Base para plantillas de registro (ventas, gastos, caja, inventario…). */
export const ledgerBaseShape = {
  businessName: text(80),
  color: hexColor,
  example: z.boolean(),
};

export const ledgerBaseDefaults = {
  businessName: "",
  color: BRAND_HEX,
  example: false,
};

export function nameField(
  label = "Nombre del negocio (opcional)",
  placeholder = "Ej. Comercial La Esperanza",
): FormFieldDef {
  return {
    type: "text",
    name: "businessName",
    label,
    placeholder,
    maxLength: 80,
    section: SECTION_BUSINESS,
    profileKey: "name",
    fullWidth: true,
  };
}

export function ledgerDesignFields(): FormFieldDef[] {
  return [colorField, { ...exampleField, section: SECTION_DESIGN }];
}

export const currentYear = () => new Date().getFullYear();

export const yearSchema = z.coerce.number({ error: "Escribe un año" }).int().min(2000).max(2100);

/** Fecha ISO dentro del año indicado (para datos de ejemplo). */
export function exampleDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function titleWith(base: string, businessName: string): string {
  return businessName ? `${base} — ${businessName}` : base;
}
