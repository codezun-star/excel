import ExcelJS from "exceljs";

import type { CountryContext } from "@/countries";

export const SITE_NAME = "Excel Codezun";
export const SITE_HOST = "excel.codezun.com";

/** Opciones que dependen del plan del usuario, no de la configuración. */
export interface BuildOptions {
  /** Marca de agua sutil "Hecho con Excel Codezun" en la hoja de instrucciones */
  watermark: boolean;
  /** Marca propia (plan Negocio): reemplaza el crédito de Excel Codezun */
  branding?: { name: string; footer?: string } | null;
}

export const DEFAULT_BUILD_OPTIONS: BuildOptions = { watermark: true, branding: null };

export function createWorkbook(opts: {
  title: string;
  ctx: CountryContext;
  options?: BuildOptions;
  description?: string;
}): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const brand = opts.options?.branding?.name;
  wb.creator = brand ?? SITE_NAME;
  wb.lastModifiedBy = brand ?? SITE_NAME;
  wb.company = brand ?? SITE_NAME;
  wb.title = opts.title;
  wb.subject = opts.description ?? opts.title;
  wb.keywords = `${opts.ctx.name}, plantilla, excel`;
  wb.created = new Date();
  wb.modified = new Date();
  // Obliga a Excel a recalcular todas las fórmulas al abrir el archivo.
  wb.calcProperties.fullCalcOnLoad = true;
  return wb;
}

/** Abre el archivo en la primera hoja (la principal) al abrirlo en Excel. */
export function setActiveSheet(wb: ExcelJS.Workbook, index = 0): void {
  wb.views = [
    {
      x: 0,
      y: 0,
      width: 20000,
      height: 12000,
      firstSheet: 0,
      activeTab: index,
      visibility: "visible",
    },
  ];
}

/** Nombre de archivo sugerido para la descarga. */
export function workbookFileName(slug: string, ctx: CountryContext, suffix?: string): string {
  const extra = suffix ? `-${suffix}` : "";
  return `${slug}-${ctx.slug}${extra}.xlsx`;
}
