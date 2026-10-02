import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "taller-mecanico",
  title: "Control de taller mecánico",
  shortDescription:
    "Órdenes de trabajo con vehículo, repuestos, mano de obra, ISV opcional, anticipos, saldo y estado de cada reparación.",
  category: "negocios",
  businessTypes: ["taller"],
  tier: "free",
  seo: {
    title: "Órdenes de trabajo para taller mecánico en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para talleres mecánicos: órdenes de trabajo, repuestos por orden, mano de obra, anticipos, saldo y estado de cada vehículo.",
    keywords: [
      "orden de trabajo taller mecánico excel",
      "control de taller mecánico",
      "registro de reparaciones",
      "control de repuestos taller",
    ],
  },
  details: {
    includes: [
      "Órdenes numeradas con cliente, vehículo, placa, kilometraje y trabajo solicitado",
      "Repuestos por orden con cantidad y precio",
      "Mano de obra, ISV opcional, anticipo y saldo por cobrar",
      "Estado de cada vehículo y resumen de ingresos",
    ],
    audience: ["Talleres mecánicos y de motos", "Talleres de enderezado y pintura"],
  },
});
