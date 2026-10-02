import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "transporte-taxis",
  title: "Control de taxis y transporte",
  shortDescription:
    "Ingresos diarios por unidad, combustible, gastos, mantenimientos con próximo servicio y ganancia neta de cada taxi, mototaxi o bus.",
  category: "negocios",
  businessTypes: ["transporte"],
  tier: "free",
  seo: {
    title: "Control de taxis y mototaxis en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para dueños de taxis, mototaxis y buses: entregas diarias por unidad, combustible, mantenimiento y ganancia neta del mes.",
    keywords: [
      "control de taxis excel",
      "control de mototaxis",
      "ingresos diarios por unidad",
      "control de mantenimiento vehículos",
    ],
  },
  details: {
    includes: [
      "Unidades con conductor y entrega diaria esperada",
      "Registro diario: ingresos o entrega, combustible, otros gastos y kilometraje",
      "Mantenimientos con costo y kilometraje del próximo servicio",
      "Resumen del mes por unidad: ingresos, gastos y ganancia neta",
    ],
    audience: ["Dueños de taxis y mototaxis", "Pequeñas empresas de transporte y buses"],
  },
});
