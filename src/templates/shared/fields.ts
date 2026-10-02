import type { FormFieldDef } from "../types";

/** Campos de formulario comunes a muchas plantillas. */

export const SECTION_BUSINESS = "Datos del negocio";
export const SECTION_DESIGN = "Diseño y formato";
export const SECTION_CONTENT = "Contenido";

export const COLOR_PRESETS = ["#217346", "#185C37", "#1F4E79", "#7A1F5C", "#B45309", "#374151"];

export function businessFields(opts: { logo?: boolean; email?: boolean } = {}): FormFieldDef[] {
  const fields: FormFieldDef[] = [
    {
      type: "text",
      name: "businessName",
      label: "Nombre del negocio",
      placeholder: "Ej. Comercial La Esperanza",
      required: true,
      maxLength: 80,
      section: SECTION_BUSINESS,
      profileKey: "name",
    },
    {
      type: "text",
      name: "taxId",
      label: "RTN",
      description: "Registro Tributario Nacional (14 dígitos).",
      placeholder: "0801-1990-123456",
      maxLength: 25,
      inputMode: "numeric",
      taxId: true,
      section: SECTION_BUSINESS,
      profileKey: "rtn",
    },
    {
      type: "text",
      name: "address",
      label: "Dirección",
      placeholder: "Barrio, ciudad, departamento",
      maxLength: 120,
      section: SECTION_BUSINESS,
      profileKey: "address",
      fullWidth: true,
    },
    {
      type: "text",
      name: "phone",
      label: "Teléfono",
      placeholder: "+504 9999-9999",
      maxLength: 40,
      inputMode: "tel",
      section: SECTION_BUSINESS,
      profileKey: "phone",
    },
  ];
  if (opts.email !== false) {
    fields.push({
      type: "text",
      name: "email",
      label: "Correo electrónico",
      placeholder: "ventas@minegocio.hn",
      maxLength: 80,
      inputMode: "email",
      section: SECTION_BUSINESS,
      profileKey: "email",
    });
  }
  if (opts.logo !== false) {
    fields.push({
      type: "image",
      name: "logo",
      label: "Logo (opcional)",
      description: "PNG o JPG. Se ajusta automáticamente. Disponible en los planes de pago.",
      proOnly: true,
      maxWidth: 480,
      maxHeight: 240,
      section: SECTION_BUSINESS,
      profileKey: "logo",
      fullWidth: true,
    });
  }
  return fields;
}

export const colorField: FormFieldDef = {
  type: "color",
  name: "color",
  label: "Color principal",
  presets: COLOR_PRESETS,
  section: SECTION_DESIGN,
  profileKey: "color",
};

export const paperField: FormFieldDef = {
  type: "select",
  name: "paper",
  label: "Tamaño de papel",
  options: [
    { value: "letter", label: "Carta" },
    { value: "a4", label: "A4" },
  ],
  section: SECTION_DESIGN,
};

export const exampleField: FormFieldDef = {
  type: "switch",
  name: "example",
  label: "Incluir datos de ejemplo",
  description:
    "Rellena algunas filas para que veas cómo funcionan las fórmulas. Bórralos cuando quieras.",
  section: SECTION_DESIGN,
};

export function titleField(defaultLabel = "Título del archivo"): FormFieldDef {
  return {
    type: "text",
    name: "title",
    label: defaultLabel,
    maxLength: 80,
    section: SECTION_CONTENT,
    fullWidth: true,
  };
}

export function rowsField(name: string, label: string, min: number, max: number): FormFieldDef {
  return { type: "number", name, label, min, max, step: 1, section: SECTION_CONTENT };
}
