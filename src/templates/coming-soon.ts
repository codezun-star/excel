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
  comingSoon("educacion", {
    slug: "asistencia-escolar",
    title: "Asistencia escolar",
    shortDescription: "Lista de asistencia mensual con porcentaje por alumno.",
    tier: "free",
    businessTypes: ["escuela"],
  }),
  comingSoon("educacion", {
    slug: "horario-de-clases",
    title: "Horario de clases",
    shortDescription: "Horario semanal por grado o docente listo para imprimir.",
    tier: "free",
    businessTypes: ["escuela"],
  }),
  comingSoon("educacion", {
    slug: "planificador-de-estudio",
    title: "Planificador de estudio",
    shortDescription: "Plan semanal de estudio con metas y seguimiento.",
    tier: "free",
  }),
  comingSoon("educacion", {
    slug: "pagos-de-academias",
    title: "Pagos de academias",
    shortDescription: "Inscripciones, mensualidades y materiales de academias y cursos.",
    tier: "free",
    businessTypes: ["escuela"],
  }),

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
  comingSoon("salud", {
    slug: "citas-y-pacientes",
    title: "Citas y pacientes",
    shortDescription: "Agenda de citas con pacientes, motivo, estado y cobro.",
    tier: "free",
    businessTypes: ["clinica"],
  }),
  comingSoon("salud", {
    slug: "historial-de-consultas",
    title: "Historial de consultas",
    shortDescription: "Historial por paciente con diagnóstico, tratamiento y seguimiento.",
    tier: "free",
    businessTypes: ["clinica"],
  }),
  comingSoon("salud", {
    slug: "medicamentos-y-vencimientos",
    title: "Medicamentos y vencimientos",
    shortDescription: "Medicamentos con dosis, horarios, existencias y fechas de vencimiento.",
    tier: "free",
    businessTypes: ["clinica", "farmacia", "hogar"],
  }),
  comingSoon("salud", {
    slug: "seguimiento-de-salud",
    title: "Seguimiento de salud",
    shortDescription: "Presión, glucosa, peso y otros indicadores con alertas.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("salud", {
    slug: "planificador-de-comidas-y-rutinas",
    title: "Planificador de comidas y rutinas",
    shortDescription: "Menú semanal, lista de compras y rutina de ejercicio.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
];
