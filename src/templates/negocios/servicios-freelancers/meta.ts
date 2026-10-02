import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "servicios-freelancers",
  title: "Control de proyectos para freelancers",
  shortDescription:
    "Proyectos por hora o precio fijo, registro de horas, pagos recibidos, gastos, cobros pendientes y ganancia por proyecto y por cliente.",
  category: "negocios",
  businessTypes: ["freelancer", "servicios"],
  tier: "free",
  seo: {
    title: "Control de proyectos y horas para freelancers en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para freelancers y profesionales independientes: proyectos, horas trabajadas, cobros pendientes, gastos y ganancia por cliente.",
    keywords: [
      "control de proyectos freelancer excel",
      "registro de horas trabajadas",
      "control de cobros pendientes",
      "facturación por horas",
    ],
  },
  details: {
    includes: [
      "Proyectos con cobro por hora o precio fijo",
      "Registro de horas por proyecto y tarea",
      "Pagos recibidos y gastos por proyecto",
      "Pendiente de cobro y ganancia por proyecto y por cliente",
    ],
    audience: [
      "Diseñadores, programadores y consultores",
      "Profesionales independientes y agencias pequeñas",
    ],
  },
});
