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
  comingSoon("emprendedores", {
    slug: "plan-de-negocio-12-meses",
    title: "Plan de negocio a 12 meses",
    shortDescription: "Proyección de ventas, costos y utilidades para tu plan de negocio.",
    tier: "pro",
  }),
  comingSoon("emprendedores", {
    slug: "costos-de-producto",
    title: "Costos de producto",
    shortDescription: "Costo unitario con materiales, mano de obra y gastos, y precio sugerido.",
    tier: "free",
    businessTypes: ["comercio", "cafeteria-panaderia", "freelancer"],
  }),
  comingSoon("emprendedores", {
    slug: "calendario-de-contenido",
    title: "Calendario de contenido",
    shortDescription: "Publicaciones por red social, fecha, formato y estado.",
    tier: "free",
  }),
  comingSoon("emprendedores", {
    slug: "campanas-y-resultados",
    title: "Campañas y resultados",
    shortDescription: "Inversión en anuncios, alcance, clientes y costo por resultado.",
    tier: "free",
  }),
  comingSoon("emprendedores", {
    slug: "crm-simple",
    title: "CRM simple",
    shortDescription: "Clientes potenciales, seguimiento, etapa de venta y próximos pasos.",
    tier: "free",
    businessTypes: ["servicios", "freelancer", "inmobiliaria"],
  }),
  comingSoon("emprendedores", {
    slug: "metas-de-ventas",
    title: "Metas de ventas",
    shortDescription: "Metas mensuales contra ventas reales con porcentaje de cumplimiento.",
    tier: "free",
  }),
  comingSoon("emprendedores", {
    slug: "plan-de-lanzamiento",
    title: "Plan de lanzamiento",
    shortDescription: "Tareas, responsables y fechas para lanzar un producto.",
    tier: "free",
  }),

  // ---------------------------------------------------------------- Salud
];
