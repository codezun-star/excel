import type {
  CategoryId,
  TemplateBuild,
  TemplateDefinition,
  TemplateForm,
  TemplateMeta,
  TemplateSeo,
} from "./types";

type MetaInput = Omit<TemplateMeta, "status" | "seo" | "countries"> & {
  countries?: TemplateMeta["countries"];
  seo?: Partial<TemplateSeo>;
};

function autoSeo(input: MetaInput): TemplateSeo {
  const free = input.tier === "free";
  return {
    title: `${input.title} en Excel ${free ? "gratis" : "profesional"} | Excel Codezun`,
    description: `${input.shortDescription} Configúrala en línea y descarga un archivo .xlsx con fórmulas listas para Excel y Google Sheets.`,
    keywords: [
      input.title.toLowerCase(),
      `plantilla ${input.title.toLowerCase()}`,
      `${input.title.toLowerCase()} excel`,
      "plantilla excel honduras",
    ],
  };
}

function withSeo(input: MetaInput): Omit<TemplateMeta, "status"> {
  const base = autoSeo(input);
  return {
    ...input,
    countries: input.countries ?? "ALL",
    seo: {
      title: input.seo?.title ?? base.title,
      description: input.seo?.description ?? base.description,
      keywords: input.seo?.keywords ?? base.keywords,
    },
  };
}

/** Metadatos de una plantilla implementada. */
export function defineMeta(input: MetaInput): TemplateMeta & { status: "ready" } {
  return { ...withSeo(input), status: "ready" };
}

/** Entrada del catálogo aún no implementada. */
export function comingSoon(
  category: CategoryId,
  input: Omit<MetaInput, "category">,
): TemplateMeta & { status: "coming-soon" } {
  return { ...withSeo({ ...input, category }), status: "coming-soon" };
}

export function defineForm<TConfig>(form: TemplateForm<TConfig>): TemplateForm<TConfig> {
  return form;
}

export function defineTemplate<TConfig>(
  meta: TemplateMeta & { status: "ready" },
  form: TemplateForm<TConfig>,
  build: TemplateBuild<TConfig>,
): TemplateDefinition<TConfig> {
  return { ...meta, ...form, build };
}
