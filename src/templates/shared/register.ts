import type { FormFieldDef } from "../types";
import { SECTION_CONTENT } from "./fields";

/** Campos de formulario frecuentes en plantillas de registro. */

export function rowsField(
  name: string,
  label: string,
  min: number,
  max: number,
  step = 10,
  description?: string,
): FormFieldDef {
  return { type: "number", name, label, min, max, step, section: SECTION_CONTENT, description };
}

export function moneyField(
  name: string,
  label: string,
  step = 100,
  description?: string,
): FormFieldDef {
  return { type: "number", name, label, min: 0, step, section: SECTION_CONTENT, description };
}

export function percentField(
  name: string,
  label: string,
  description?: string,
  max = 100,
): FormFieldDef {
  return {
    type: "number",
    name,
    label,
    min: 0,
    max,
    step: 0.5,
    suffix: "%",
    section: SECTION_CONTENT,
    description,
  };
}

export function listField(
  name: string,
  label: string,
  opts: {
    itemPlaceholder?: string;
    maxItems?: number;
    addLabel?: string;
    description?: string;
  } = {},
): FormFieldDef {
  return {
    type: "list",
    name,
    label,
    itemPlaceholder: opts.itemPlaceholder,
    maxItems: opts.maxItems ?? 30,
    addLabel: opts.addLabel ?? "Agregar",
    description: opts.description,
    section: SECTION_CONTENT,
  };
}

export function textField(
  name: string,
  label: string,
  placeholder?: string,
  maxLength = 80,
): FormFieldDef {
  return { type: "text", name, label, placeholder, maxLength, section: SECTION_CONTENT };
}

/** Identificador correlativo ("P-001") para la fila `index` (0) mientras la celda guía tenga dato. */
export function correlativeId(prefix: string, guide: string, index: number): string {
  return `IF(${guide}="","","${prefix}"&RIGHT("000"&${index + 1},3))`;
}
