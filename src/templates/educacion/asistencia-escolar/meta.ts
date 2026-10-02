import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "asistencia-escolar",
  title: "Asistencia escolar",
  shortDescription:
    "Lista de asistencia por mes con los días hábiles ya puestos, códigos P, A, T y J, porcentaje por alumno, alertas y resumen del año escolar.",
  category: "educacion",
  businessTypes: ["escuela"],
  tier: "free",
  seo: {
    title: "Lista de asistencia escolar en Excel gratis por mes | Excel Codezun",
    description:
      "Plantilla gratis de control de asistencia para docentes: una hoja por mes con días hábiles, porcentaje por alumno y resumen anual.",
    keywords: [
      "lista de asistencia excel",
      "control de asistencia escolar",
      "registro de asistencia de alumnos",
      "formato de asistencia docente honduras",
    ],
  },
  details: {
    includes: [
      "Lista de alumnos una sola vez para todo el año",
      "Una hoja por mes con los días hábiles y su día de la semana",
      "Presentes, ausencias, tardanzas, justificadas y porcentaje por alumno",
      "Alumnos bajo la asistencia mínima resaltados en rojo",
      "Resumen anual por alumno y por mes",
    ],
    audience: [
      "Docentes de escuelas, colegios e institutos",
      "Academias, catequesis y grupos de formación",
    ],
  },
});
