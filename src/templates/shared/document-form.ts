import { z } from "zod";

import type { CountryContext } from "@/countries";
import { BRAND_HEX } from "@/lib/excel/styles";

import type { FormFieldDef } from "../types";
import {
  SECTION_CONTENT,
  SECTION_DESIGN,
  businessFields,
  colorField,
  exampleField,
  paperField,
} from "./fields";
import {
  hexColor,
  imageDataUrl,
  isoDate,
  optionalInt,
  paper,
  rowsCount,
  stringList,
  taxIdText,
  text,
} from "./schema";

/**
 * Piezas compartidas por los documentos comerciales (factura, cotización,
 * orden de compra, nota de crédito): datos del negocio, numeración, líneas,
 * columnas opcionales, formas de pago y diseño.
 */

export const SECTION_NUMBERING = "Numeración y datos SAR";

export const documentBaseShape = {
  businessName: text(80),
  taxId: taxIdText,
  address: text(120),
  phone: text(40),
  email: text(80),
  logo: imageDataUrl,
  color: hexColor,
  prefix: text(30),
  startNumber: z.coerce.number({ error: "Escribe un número" }).int().min(1).max(99_999_999),
  lines: rowsCount(5, 100),
  optionalColumns: z.array(z.enum(["code", "discount", "unit"])),
  paymentMethods: stringList(12, 40),
  amountInWords: z.boolean(),
  notes: text(300),
  paper,
  example: z.boolean(),
};

export const fiscalShape = {
  cai: text(60),
  rangeFrom: optionalInt(),
  rangeTo: optionalInt(),
  deadline: isoDate,
};

export const taxShape = {
  includeTax: z.boolean(),
  defaultRate: z.enum(["standard", "special", "exempt", "exonerated"]),
};

export function documentBaseDefaults(ctx: CountryContext) {
  return {
    businessName: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    logo: "",
    color: BRAND_HEX,
    prefix: ctx.invoicing.defaultPrefix,
    startNumber: 1,
    lines: 15,
    optionalColumns: ["discount"] as ("code" | "discount" | "unit")[],
    paymentMethods: ["Efectivo", "Tarjeta", "Transferencia", "Cheque"],
    amountInWords: true,
    notes: "",
    paper: "letter" as const,
    example: false,
  };
}

export const fiscalDefaults = { cai: "", rangeFrom: null, rangeTo: null, deadline: "" };

export function numberingFields(
  opts: { prefixLabel?: string; section?: string } = {},
): FormFieldDef[] {
  const section = opts.section ?? SECTION_NUMBERING;
  return [
    {
      type: "text",
      name: "prefix",
      label: opts.prefixLabel ?? "Prefijo de numeración",
      placeholder: "000-001-01-",
      maxLength: 30,
      section,
    },
    { type: "number", name: "startNumber", label: "Correlativo inicial", min: 1, step: 1, section },
  ];
}

export function fiscalFields(): FormFieldDef[] {
  return [
    {
      type: "text",
      name: "cai",
      label: "CAI (opcional)",
      placeholder: "XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX",
      maxLength: 60,
      section: SECTION_NUMBERING,
      fullWidth: true,
    },
    {
      type: "number",
      name: "rangeFrom",
      label: "Rango autorizado: desde",
      min: 0,
      step: 1,
      section: SECTION_NUMBERING,
    },
    {
      type: "number",
      name: "rangeTo",
      label: "Rango autorizado: hasta",
      min: 0,
      step: 1,
      section: SECTION_NUMBERING,
    },
    {
      type: "date",
      name: "deadline",
      label: "Fecha límite de emisión (opcional)",
      section: SECTION_NUMBERING,
    },
  ];
}

export function rateField(opts: { showWhenTax?: boolean } = {}): FormFieldDef {
  return {
    type: "select",
    name: "defaultRate",
    label: "Tasa de ISV predeterminada por línea",
    description: "Cada línea se puede cambiar en el archivo con una lista desplegable.",
    options: (ctx) =>
      ctx.taxes.salesTax.rates.map((r) => ({
        value: r.id,
        label: `${r.label} — ${r.description}`,
      })),
    section: SECTION_CONTENT,
    ...(opts.showWhenTax ? { showWhen: { field: "includeTax", equals: true } } : {}),
  };
}

export function linesFields(opts: { paymentLabel?: string } = {}): FormFieldDef[] {
  return [
    {
      type: "number",
      name: "lines",
      label: "Cantidad de líneas",
      min: 5,
      max: 100,
      step: 1,
      section: SECTION_CONTENT,
    },
    {
      type: "multiselect",
      name: "optionalColumns",
      label: "Columnas opcionales",
      options: [
        { value: "code", label: "Código de producto" },
        { value: "unit", label: "Unidad de medida" },
        { value: "discount", label: "Descuento por línea" },
      ],
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    {
      type: "list",
      name: "paymentMethods",
      label: opts.paymentLabel ?? "Formas de pago",
      description: "Aparecen como lista desplegable en el documento.",
      itemPlaceholder: "Ej. Transferencia",
      maxItems: 12,
      addLabel: "Agregar forma de pago",
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    { type: "switch", name: "amountInWords", label: "Total en letras", section: SECTION_CONTENT },
  ];
}

export function documentDesignFields(): FormFieldDef[] {
  return [
    {
      type: "textarea",
      name: "notes",
      label: "Nota al pie",
      rows: 2,
      maxLength: 300,
      section: SECTION_CONTENT,
      fullWidth: true,
    },
    colorField,
    paperField,
    { ...exampleField, section: SECTION_DESIGN },
  ];
}

export { businessFields };

/** Líneas de ejemplo para documentos comerciales. */
export function exampleLines(ctx: CountryContext) {
  const rate = (id: string) => ctx.taxes.salesTax.rates.find((r) => r.id === id)?.label ?? "";
  return [
    {
      code: "P-001",
      desc: "Camisa polo bordada",
      unit: "Unidad",
      qty: 2,
      price: 350,
      disc: 20,
      rate: rate("standard"),
    },
    {
      code: "B-014",
      desc: "Cerveza nacional (caja de 12)",
      unit: "Caja",
      qty: 1,
      price: 520,
      disc: 0,
      rate: rate("special"),
    },
    {
      code: "L-220",
      desc: "Libro escolar",
      unit: "Unidad",
      qty: 3,
      price: 180,
      disc: 0,
      rate: rate("exempt"),
    },
  ];
}

export function columnsFrom(optional: string[]) {
  return {
    code: optional.includes("code"),
    discount: optional.includes("discount"),
    unit: optional.includes("unit"),
  };
}
