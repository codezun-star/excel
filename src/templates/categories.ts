import type { BusinessTypeId, CategoryId } from "./types";

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  description: string;
  /** Nombre del ícono de lucide-react (se resuelve en la interfaz) */
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "facturacion",
    name: "Facturación y ventas",
    description: "Facturas, cotizaciones, recibos, cuentas por cobrar y reportes de ventas.",
    icon: "Receipt",
  },
  {
    id: "impuestos",
    name: "Impuestos y contabilidad",
    description: "ISV, ISR, flujo de caja, estados financieros y conciliaciones.",
    icon: "Landmark",
  },
  {
    id: "planilla",
    name: "Planilla y RRHH",
    description: "Sueldos con IHSS, RAP e ISR, décimos, prestaciones y asistencia.",
    icon: "Users",
  },
  {
    id: "inventario",
    name: "Inventario y comercio",
    description: "Control de stock, kardex, precios, fiados y pedidos.",
    icon: "Boxes",
  },
  {
    id: "negocios",
    name: "Por tipo de negocio",
    description: "Plantillas pensadas para pulperías, restaurantes, talleres y más.",
    icon: "Store",
  },
  {
    id: "educacion",
    name: "Educación",
    description: "Notas, asistencia, mensualidades y horarios.",
    icon: "GraduationCap",
  },
  {
    id: "finanzas-personales",
    name: "Finanzas personales",
    description: "Presupuesto, gastos, préstamos, ahorro y remesas.",
    icon: "Wallet",
  },
  {
    id: "comunidad",
    name: "Comunidad",
    description: "Patronatos, cajas rurales, iglesias, rifas y asociaciones.",
    icon: "HandHeart",
  },
  {
    id: "bienes-raices",
    name: "Bienes raíces",
    description: "Alquileres, propiedades y venta de lotes a plazos.",
    icon: "Building2",
  },
  {
    id: "emprendedores",
    name: "Emprendedores y marketing",
    description: "Costos, CRM, metas de ventas y planes de negocio.",
    icon: "Rocket",
  },
  {
    id: "salud",
    name: "Salud",
    description: "Citas, pacientes, medicamentos y seguimiento.",
    icon: "HeartPulse",
  },
];

export interface BusinessTypeInfo {
  id: BusinessTypeId;
  name: string;
}

export const BUSINESS_TYPES: BusinessTypeInfo[] = [
  { id: "comercio", name: "Comercio en general" },
  { id: "pulperia", name: "Pulpería / mini súper" },
  { id: "restaurante", name: "Restaurante / comedor" },
  { id: "cafeteria-panaderia", name: "Cafetería / panadería" },
  { id: "taller", name: "Taller mecánico" },
  { id: "barberia-salon", name: "Barbería / salón de belleza" },
  { id: "ferreteria", name: "Ferretería" },
  { id: "farmacia", name: "Farmacia" },
  { id: "tienda-ropa", name: "Tienda de ropa" },
  { id: "transporte", name: "Transporte / taxis" },
  { id: "constructora", name: "Construcción" },
  { id: "agro", name: "Agricultura, café y ganadería" },
  { id: "pesca", name: "Pesca y camaroneras" },
  { id: "servicios", name: "Servicios profesionales" },
  { id: "freelancer", name: "Freelancer / independiente" },
  { id: "escuela", name: "Escuela / academia" },
  { id: "iglesia-ong", name: "Iglesia / ONG / patronato" },
  { id: "inmobiliaria", name: "Bienes raíces" },
  { id: "clinica", name: "Clínica / consultorio" },
  { id: "hogar", name: "Hogar y familia" },
];

export function getCategory(id: CategoryId): CategoryInfo {
  const c = CATEGORIES.find((x) => x.id === id);
  if (!c) throw new Error(`Categoría desconocida: ${id}`);
  return c;
}

export function getBusinessType(id: BusinessTypeId): BusinessTypeInfo | undefined {
  return BUSINESS_TYPES.find((b) => b.id === id);
}

/** Grupos reutilizables de tipos de negocio. */
export const ALL_SHOPS: BusinessTypeId[] = [
  "comercio",
  "pulperia",
  "ferreteria",
  "farmacia",
  "tienda-ropa",
  "cafeteria-panaderia",
  "restaurante",
];
export const ALL_EMPLOYERS: BusinessTypeId[] = [
  "comercio",
  "restaurante",
  "taller",
  "constructora",
  "agro",
  "servicios",
  "ferreteria",
  "farmacia",
  "escuela",
  "clinica",
];
