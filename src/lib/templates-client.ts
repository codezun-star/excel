"use client";

import { CLIENT_BUILDERS } from "@/templates/registry/client-builders";
import { FORM_LOADERS } from "@/templates/registry/forms";
import type { AnyTemplateBuild, AnyTemplateForm } from "@/templates/types";

/** Carga perezosa del formulario de una plantilla (sin ExcelJS). */
export async function loadTemplateForm(slug: string): Promise<AnyTemplateForm | null> {
  const loader = FORM_LOADERS[slug];
  return loader ? loader() : null;
}

/** Carga perezosa del build de una plantilla gratis (incluye ExcelJS). */
export async function loadClientBuilder(slug: string): Promise<AnyTemplateBuild | null> {
  const loader = CLIENT_BUILDERS[slug];
  return loader ? loader() : null;
}
