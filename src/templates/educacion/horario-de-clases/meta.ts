import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "horario-de-clases",
  title: "Horario de clases",
  shortDescription:
    "Horario semanal por grado con horas que se calculan solas, recreo, colores por materia, carga horaria por materia y por docente, listo para imprimir.",
  category: "educacion",
  businessTypes: ["escuela"],
  tier: "free",
  seo: {
    title: "Horario de clases en Excel gratis para imprimir | Excel Codezun",
    description:
      "Plantilla gratis de horario escolar semanal por grado o sección: horas automáticas, recreo, colores por materia y carga horaria docente.",
    keywords: [
      "horario de clases excel",
      "horario escolar para imprimir",
      "formato de horario semanal",
      "carga horaria docente",
    ],
  },
  details: {
    includes: [
      "Una hoja de horario por grado o sección con días y periodos",
      "Hora de inicio y fin de cada periodo calculadas con el recreo",
      "Cada materia con su color para leer el horario de un vistazo",
      "Periodos y horas por semana de cada materia y de cada docente",
    ],
    audience: ["Directores y coordinadores académicos", "Docentes, academias y estudiantes"],
  },
});
