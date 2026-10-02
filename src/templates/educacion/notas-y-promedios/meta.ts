import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "notas-y-promedios",
  title: "Notas y promedios",
  shortDescription:
    "Registro de calificaciones por asignatura y parcial con promedios, aprobados, reprobados, consolidado y posición de cada alumno.",
  category: "educacion",
  businessTypes: ["escuela"],
  tier: "free",
  featured: true,
  seo: {
    title: "Registro de notas y promedios en Excel gratis para docentes | Excel Codezun",
    description:
      "Plantilla gratis de registro de calificaciones en Excel: notas por parcial y asignatura, promedios, aprobados, reprobados y cuadro consolidado.",
    keywords: [
      "registro de notas excel",
      "calcular promedio de notas",
      "cuadro de calificaciones",
      "notas por parcial",
    ],
  },
  details: {
    includes: [
      "Una hoja por asignatura con notas por parcial",
      "Promedio, estado aprobado o reprobado y estadísticas de la sección",
      "Consolidado con promedio general, asignaturas reprobadas y posición",
      "Nota mínima de aprobación configurable",
    ],
    audience: ["Docentes de escuelas y colegios", "Academias y centros de formación"],
  },
});
