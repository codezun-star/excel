import type { CountryContext } from "@/countries";

/** Nombre de archivo sugerido para la descarga (sin depender de ExcelJS). */
export function workbookFileName(
  slug: string,
  ctx: Pick<CountryContext, "slug">,
  suffix?: string,
): string {
  const extra = suffix ? `-${suffix}` : "";
  return `${slug}-${ctx.slug}${extra}.xlsx`;
}
