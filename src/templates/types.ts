import type ExcelJS from "exceljs";
import type { z } from "zod";

import type { CountryCode, CountryContext } from "@/countries";
import type { BuildOptions } from "@/lib/excel/workbook";

export type { BuildOptions } from "@/lib/excel/workbook";

export type CategoryId =
  | "facturacion"
  | "impuestos"
  | "planilla"
  | "inventario"
  | "negocios"
  | "educacion"
  | "finanzas-personales"
  | "comunidad"
  | "bienes-raices"
  | "emprendedores"
  | "salud";

export type BusinessTypeId =
  | "comercio"
  | "pulperia"
  | "restaurante"
  | "taller"
  | "barberia-salon"
  | "ferreteria"
  | "farmacia"
  | "transporte"
  | "tienda-ropa"
  | "cafeteria-panaderia"
  | "freelancer"
  | "constructora"
  | "agro"
  | "pesca"
  | "servicios"
  | "escuela"
  | "iglesia-ong"
  | "inmobiliaria"
  | "clinica"
  | "hogar";

export type TemplateTier = "free" | "pro";
export type TemplateStatus = "ready" | "coming-soon";

export interface TemplateSeo {
  title: string;
  description: string;
  keywords: string[];
}

/** Metadatos públicos: se usan en catálogo, SEO y sitemap (sin ExcelJS). */
export interface TemplateMeta {
  slug: string;
  title: string;
  shortDescription: string;
  category: CategoryId;
  businessTypes?: BusinessTypeId[];
  /** Dónde aplica. "ALL" = cualquier país (usa la moneda del país elegido) */
  countries: CountryCode[] | "ALL";
  tier: TemplateTier;
  status: TemplateStatus;
  seo: TemplateSeo;
  /** Las plantillas fiscales o laborales muestran aviso legal y fecha de revisión */
  regulated?: "fiscal" | "laboral";
  featured?: boolean;
  details?: {
    includes: string[];
    audience: string[];
  };
}

export interface FieldOption {
  value: string;
  label: string;
}

export type OptionsSource = FieldOption[] | ((ctx: CountryContext) => FieldOption[]);

/** Campos que se pueden rellenar desde un perfil de cliente (plan Negocio). */
export type ProfileKey = "name" | "rtn" | "address" | "phone" | "email" | "logo" | "color";

interface BaseField {
  name: string;
  label: string;
  description?: string;
  /** Título de la sección del formulario donde aparece el campo */
  section?: string;
  required?: boolean;
  /** Requiere plan Pro (se muestra con candado en planes gratis) */
  proOnly?: boolean;
  profileKey?: ProfileKey;
  /** Mostrar solo si otro campo tiene cierto valor */
  showWhen?: { field: string; equals: string | number | boolean };
  fullWidth?: boolean;
}

export type FormFieldDef =
  | (BaseField & {
      type: "text";
      placeholder?: string;
      maxLength?: number;
      inputMode?: "text" | "numeric" | "tel" | "email";
      /** Usa la etiqueta, el ejemplo y el formato del identificador tributario del país */
      taxId?: boolean;
    })
  | (BaseField & { type: "textarea"; placeholder?: string; rows?: number; maxLength?: number })
  | (BaseField & { type: "number"; min?: number; max?: number; step?: number; suffix?: string })
  | (BaseField & { type: "date" })
  | (BaseField & { type: "select"; options: OptionsSource })
  | (BaseField & { type: "multiselect"; options: OptionsSource })
  | (BaseField & { type: "switch" })
  | (BaseField & { type: "color"; presets?: string[] })
  | (BaseField & {
      type: "list";
      itemPlaceholder?: string;
      minItems?: number;
      maxItems?: number;
      addLabel?: string;
    })
  | (BaseField & { type: "image"; maxWidth?: number; maxHeight?: number });

export type FieldType = FormFieldDef["type"];

/** Parte del formulario: segura para enviarse al navegador. */
export interface TemplateForm<TConfig> {
  configSchema: z.ZodType<TConfig>;
  formFields: FormFieldDef[];
  /** Puede depender del país (prefijos de factura, tasas predeterminadas…) */
  defaultConfig: TConfig | ((ctx: CountryContext) => TConfig);
}

export type TemplateBuild<TConfig> = (
  config: TConfig,
  ctx: CountryContext,
  options?: BuildOptions,
) => Promise<ExcelJS.Workbook>;

/** Definición completa de una plantilla lista. */
export interface TemplateDefinition<TConfig> extends TemplateMeta, TemplateForm<TConfig> {
  status: "ready";
  build: TemplateBuild<TConfig>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplateDefinition = TemplateDefinition<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplateForm = TemplateForm<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplateBuild = TemplateBuild<any>;

export function resolveDefaultConfig<T>(form: TemplateForm<T>, ctx: CountryContext): T {
  return typeof form.defaultConfig === "function"
    ? (form.defaultConfig as (c: CountryContext) => T)(ctx)
    : form.defaultConfig;
}

export function resolveOptions(source: OptionsSource, ctx: CountryContext): FieldOption[] {
  return typeof source === "function" ? source(ctx) : source;
}

export function appliesToCountry(
  meta: Pick<TemplateMeta, "countries">,
  code: CountryCode,
): boolean {
  return meta.countries === "ALL" || meta.countries.includes(code);
}
