/**
 * Preparación para i18n: hoy la interfaz está en español neutro
 * latinoamericano. Los textos de interfaz compartidos viven en
 * diccionarios (es.ts); para agregar un idioma, crea otro diccionario con
 * la misma forma y selecciónalo por ruta o encabezado.
 */
export const LOCALES = ["es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";
