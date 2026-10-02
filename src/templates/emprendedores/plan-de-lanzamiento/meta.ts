import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "plan-de-lanzamiento",
  title: "Plan de lanzamiento",
  shortDescription:
    "Lista de tareas para lanzar un producto o negocio con fechas calculadas desde el día del lanzamiento, responsables, estado, diagrama de Gantt semanal, presupuesto y cuenta regresiva.",
  category: "emprendedores",
  businessTypes: ["comercio", "servicios", "restaurante", "tienda-ropa", "freelancer"],
  tier: "free",
  seo: {
    title: "Plan de lanzamiento de producto en Excel gratis con Gantt | Excel Codezun",
    description:
      "Plantilla gratis con las tareas para lanzar tu producto o negocio: fechas automáticas, responsables, diagrama de Gantt, presupuesto y avance.",
    keywords: [
      "plan de lanzamiento excel",
      "checklist lanzamiento de producto",
      "diagrama de gantt excel gratis",
      "abrir un negocio pasos",
    ],
  },
  details: {
    includes: [
      "Más de 20 tareas típicas de un lanzamiento ya escritas y agrupadas por fase",
      "Fechas de inicio y fin calculadas desde el día del lanzamiento",
      "Responsable, estado, alertas de tareas atrasadas y cuenta regresiva",
      "Diagrama de Gantt semanal que se pinta solo",
      "Presupuesto estimado contra gasto real por fase",
    ],
    audience: [
      "Emprendedores que abren un negocio o lanzan un producto",
      "Equipos pequeños que organizan una apertura o evento",
    ],
  },
});
