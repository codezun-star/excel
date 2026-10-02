import { ALL_EMPLOYERS } from "./categories";
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
  comingSoon("planilla", {
    slug: "evaluacion-de-desempeno",
    title: "Evaluación de desempeño",
    shortDescription: "Evaluación por competencias con ponderaciones y calificación final.",
    tier: "free",
    businessTypes: ALL_EMPLOYERS,
  }),
  comingSoon("planilla", {
    slug: "prestamos-a-empleados",
    title: "Préstamos a empleados",
    shortDescription: "Control de préstamos y adelantos con cuotas descontadas en planilla.",
    tier: "free",
    businessTypes: ALL_EMPLOYERS,
  }),
  comingSoon("planilla", {
    slug: "comisiones-y-bonos",
    title: "Comisiones y bonos",
    shortDescription: "Cálculo de comisiones escalonadas y bonos por cumplimiento.",
    tier: "pro",
    businessTypes: ["comercio", "servicios", "tienda-ropa", "ferreteria"],
  }),

  // ---------------------------------------------------------------- Inventario
  comingSoon("inventario", {
    slug: "inventario-por-lote-vencimiento",
    title: "Inventario por lote y vencimiento",
    shortDescription: "Lotes con fecha de vencimiento y alertas de productos por vencer.",
    tier: "pro",
    businessTypes: ["farmacia", "pulperia", "comercio", "cafeteria-panaderia"],
  }),
  comingSoon("inventario", {
    slug: "mercaderia-en-consignacion",
    title: "Mercadería en consignación",
    shortDescription:
      "Productos recibidos o entregados en consignación con ventas y liquidaciones.",
    tier: "pro",
    businessTypes: ["comercio", "tienda-ropa"],
  }),
  comingSoon("inventario", {
    slug: "pedidos-y-entregas",
    title: "Pedidos y entregas",
    shortDescription: "Seguimiento de pedidos con estado, fecha de entrega, anticipos y saldos.",
    tier: "free",
    businessTypes: ["comercio", "cafeteria-panaderia", "restaurante", "tienda-ropa"],
  }),
  comingSoon("inventario", {
    slug: "ventas-por-whatsapp",
    title: "Ventas por WhatsApp",
    shortDescription:
      "Registro de pedidos por WhatsApp y redes con envíos, pagos y clientes frecuentes.",
    tier: "free",
    businessTypes: ["comercio", "tienda-ropa", "cafeteria-panaderia"],
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
  comingSoon("negocios", {
    slug: "pulperia",
    title: "Control para pulpería",
    shortDescription:
      "Ventas del día, compras a proveedores, fiados y ganancia diaria en un solo archivo.",
    tier: "free",
    businessTypes: ["pulperia"],
  }),
  comingSoon("negocios", {
    slug: "restaurante-costos-recetas",
    title: "Costos de recetas para restaurante",
    shortDescription: "Costo por porción, precio sugerido y margen de cada platillo.",
    tier: "pro",
    businessTypes: ["restaurante", "cafeteria-panaderia"],
  }),
  comingSoon("negocios", {
    slug: "taller-mecanico",
    title: "Taller mecánico",
    shortDescription: "Órdenes de trabajo con repuestos, mano de obra y estado de cada vehículo.",
    tier: "free",
    businessTypes: ["taller"],
  }),
  comingSoon("negocios", {
    slug: "barberia-salon",
    title: "Barbería y salón de belleza",
    shortDescription: "Servicios del día por estilista con comisiones y propinas.",
    tier: "free",
    businessTypes: ["barberia-salon"],
  }),
  comingSoon("negocios", {
    slug: "ferreteria",
    title: "Control para ferretería",
    shortDescription: "Inventario por categoría, cotizaciones rápidas y ventas al crédito.",
    tier: "free",
    businessTypes: ["ferreteria"],
  }),
  comingSoon("negocios", {
    slug: "farmacia",
    title: "Control para farmacia",
    shortDescription: "Medicamentos por lote, vencimientos y ventas diarias.",
    tier: "pro",
    businessTypes: ["farmacia"],
  }),
  comingSoon("negocios", {
    slug: "transporte-taxis",
    title: "Transporte y taxis",
    shortDescription: "Ingresos diarios por unidad, combustible, mantenimiento y ganancia neta.",
    tier: "free",
    businessTypes: ["transporte"],
  }),
  comingSoon("negocios", {
    slug: "tienda-de-ropa",
    title: "Tienda de ropa",
    shortDescription: "Inventario por talla y color, ventas y apartados.",
    tier: "free",
    businessTypes: ["tienda-ropa"],
  }),
  comingSoon("negocios", {
    slug: "cafeteria-panaderia",
    title: "Cafetería y panadería",
    shortDescription: "Producción diaria, mermas, costos de insumos y ventas.",
    tier: "free",
    businessTypes: ["cafeteria-panaderia"],
  }),
  comingSoon("negocios", {
    slug: "servicios-freelancers",
    title: "Control para freelancers",
    shortDescription: "Proyectos, horas trabajadas, cobros pendientes y ganancia por cliente.",
    tier: "free",
    businessTypes: ["freelancer", "servicios"],
  }),
  comingSoon("negocios", {
    slug: "constructora-presupuesto-de-obra",
    title: "Presupuesto de obra",
    shortDescription: "Presupuesto por renglones con materiales, mano de obra, indirectos e ISV.",
    tier: "pro",
    businessTypes: ["constructora"],
  }),
  comingSoon("negocios", {
    slug: "agricultura-cafe-ganaderia",
    title: "Agricultura, café y ganadería",
    shortDescription: "Costos de producción por manzana, cosecha, ventas y rentabilidad.",
    tier: "free",
    businessTypes: ["agro"],
  }),
  comingSoon("negocios", {
    slug: "camaroneras-pesca",
    title: "Camaroneras y pesca",
    shortDescription: "Siembra, alimento, cosecha por estanque y rendimiento.",
    tier: "pro",
    businessTypes: ["pesca"],
  }),

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
  comingSoon("finanzas-personales", {
    slug: "deudas-y-tarjetas",
    title: "Deudas y tarjetas",
    shortDescription:
      "Control de deudas y tarjetas con plan bola de nieve y fecha estimada de pago.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("finanzas-personales", {
    slug: "ahorro-por-metas",
    title: "Ahorro por metas",
    shortDescription: "Metas de ahorro con aportes mensuales, avance y fecha estimada.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("finanzas-personales", {
    slug: "comprar-vs-alquilar",
    title: "Comprar o alquilar vivienda",
    shortDescription: "Compara el costo total de comprar contra alquilar a varios años.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("finanzas-personales", {
    slug: "jubilacion",
    title: "Plan de jubilación",
    shortDescription: "Proyección de ahorro para el retiro con aportes e intereses.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("finanzas-personales", {
    slug: "pagos-de-servicios",
    title: "Pagos de servicios",
    shortDescription: "Energía, agua, internet, teléfono y más: vencimientos y pagos por mes.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("finanzas-personales", {
    slug: "presupuesto-de-bodas-eventos",
    title: "Presupuesto de bodas y eventos",
    shortDescription: "Presupuesto por rubro, proveedores, anticipos e invitados.",
    tier: "free",
    businessTypes: ["hogar"],
  }),
  comingSoon("finanzas-personales", {
    slug: "lista-del-super",
    title: "Lista del súper",
    shortDescription: "Lista de compras por pasillo con precios estimados y total.",
    tier: "free",
    businessTypes: ["hogar"],
  }),

  // ---------------------------------------------------------------- Comunidad
  comingSoon("comunidad", {
    slug: "contabilidad-de-iglesias",
    title: "Contabilidad de iglesias",
    shortDescription: "Diezmos, ofrendas, donaciones y gastos con informe mensual.",
    tier: "free",
    businessTypes: ["iglesia-ong"],
  }),
  comingSoon("comunidad", {
    slug: "rifas-y-colectas",
    title: "Rifas y colectas",
    shortDescription: "Números vendidos, pagos pendientes, premios y fondos recaudados.",
    tier: "free",
    businessTypes: ["iglesia-ong", "escuela"],
  }),
  comingSoon("comunidad", {
    slug: "aportes-asociaciones",
    title: "Aportes de asociaciones",
    shortDescription: "Aportaciones de miembros, actividades y rendición de cuentas.",
    tier: "free",
    businessTypes: ["iglesia-ong"],
  }),
  comingSoon("comunidad", {
    slug: "administracion-de-condominios",
    title: "Administración de condominios",
    shortDescription: "Cuotas de mantenimiento, gastos comunes y estado de cuenta por unidad.",
    tier: "pro",
    businessTypes: ["inmobiliaria"],
  }),

  // ---------------------------------------------------------------- Bienes raíces
  comingSoon("bienes-raices", {
    slug: "contrato-de-arrendamiento",
    title: "Datos de contrato de arrendamiento",
    shortDescription: "Ficha de contratos con fechas, montos, ajustes y renovaciones.",
    tier: "free",
    businessTypes: ["inmobiliaria"],
  }),
  comingSoon("bienes-raices", {
    slug: "gastos-de-propiedades",
    title: "Gastos de propiedades",
    shortDescription: "Gastos de mantenimiento, impuestos y servicios por propiedad.",
    tier: "free",
    businessTypes: ["inmobiliaria"],
  }),
  comingSoon("bienes-raices", {
    slug: "rentabilidad-inmobiliaria",
    title: "Rentabilidad inmobiliaria",
    shortDescription: "Rentabilidad bruta y neta, retorno de la inversión y años de recuperación.",
    tier: "pro",
    businessTypes: ["inmobiliaria"],
  }),
  comingSoon("bienes-raices", {
    slug: "ventas-de-lotes-a-plazos",
    title: "Venta de lotes a plazos",
    shortDescription: "Lotes vendidos con prima, cuotas, pagos recibidos y saldo de cada cliente.",
    tier: "pro",
    businessTypes: ["inmobiliaria"],
  }),

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
