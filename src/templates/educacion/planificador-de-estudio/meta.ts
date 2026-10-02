import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "planificador-de-estudio",
  title: "Planificador de estudio",
  shortDescription:
    "Horario semanal de estudio, metas de horas por materia, registro de sesiones, tareas y exámenes con días restantes y avance de la semana.",
  category: "educacion",
  businessTypes: ["escuela", "hogar"],
  tier: "free",
  seo: {
    title: "Planificador de estudio en Excel gratis: horario, tareas y exámenes | Excel Codezun",
    description:
      "Plantilla gratis para estudiantes de colegio y universidad: horario de estudio semanal, metas por materia, sesiones, tareas y exámenes.",
    keywords: [
      "planificador de estudio excel",
      "horario de estudio semanal",
      "control de tareas y exámenes",
      "organizador universitario",
    ],
  },
  details: {
    includes: [
      "Horario semanal de estudio por bloques de una hora",
      "Meta de horas por materia contra horas planificadas y estudiadas esta semana",
      "Registro de sesiones con tema, minutos y nivel de comprensión",
      "Tareas, proyectos y exámenes con días restantes y alertas",
    ],
    audience: [
      "Estudiantes de colegio y universidad",
      "Personas que preparan exámenes de admisión o certificaciones",
    ],
  },
});
