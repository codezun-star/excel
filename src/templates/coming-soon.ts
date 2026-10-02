import { comingSoon } from "./define";
import type { TemplateMeta } from "./types";

/**
 * Plantillas registradas en el catálogo que aún no están implementadas.
 * Cuando implementes una, muévela a su carpeta y quítala de esta lista.
 */
export const COMING_SOON: TemplateMeta[] = [
  // ---------------------------------------------------------------- Facturación

  // ---------------------------------------------------------------- Impuestos
  comingSoon("impuestos", {
    slug: "control-de-retenciones",
    title: "Control de retenciones",
    shortDescription:
      "Registro de retenciones de ISR e ISV efectuadas y recibidas con constancias.",
    tier: "pro",
    regulated: "fiscal",
    countries: ["HN"],
  }),
  comingSoon("impuestos", {
    slug: "impuesto-municipal",
    title: "Impuesto municipal",
    shortDescription:
      "Estimación del impuesto sobre industria, comercio y servicios según tu municipio.",
    tier: "pro",
    regulated: "fiscal",
    countries: ["HN"],
  }),

  // ---------------------------------------------------------------- Planilla

  // ---------------------------------------------------------------- Inventario
  comingSoon("inventario", {
    slug: "mercaderia-en-consignacion",
    title: "Mercadería en consignación",
    shortDescription:
      "Productos recibidos o entregados en consignación con ventas y liquidaciones.",
    tier: "pro",
    businessTypes: ["comercio", "tienda-ropa"],
  }),
  comingSoon("inventario", {
    slug: "costos-de-importacion-aduana",
    title: "Costos de importación y aduana",
    shortDescription: "Costo puesto en bodega: FOB, flete, seguro, DAI, ISV y gastos de aduana.",
    tier: "pro",
    regulated: "fiscal",
    countries: ["HN"],
    businessTypes: ["comercio", "ferreteria", "tienda-ropa"],
  }),

  // ---------------------------------------------------------------- Negocios

  // ---------------------------------------------------------------- Educación

  // ---------------------------------------------------------------- Finanzas personales

  // ---------------------------------------------------------------- Comunidad

  // ---------------------------------------------------------------- Bienes raíces

  // ---------------------------------------------------------------- Emprendedores

  // ---------------------------------------------------------------- Salud
];
