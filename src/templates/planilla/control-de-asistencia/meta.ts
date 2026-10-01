import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "control-de-asistencia",
  title: "Control de asistencia",
  shortDescription:
    "Hoja mensual de asistencia por empleado con códigos (presente, ausente, tardanza, vacaciones, incapacidad), colores y resumen automático.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  tier: "free",
  seo: {
    title: "Control de asistencia de personal en Excel gratis (mensual) | Excel Codezun",
    description:
      "Plantilla gratis de control de asistencia mensual en Excel: días del mes automáticos, códigos con colores y resumen de ausencias y tardanzas por empleado.",
    keywords: [
      "control de asistencia excel",
      "registro de asistencia de personal",
      "hoja de asistencia mensual",
    ],
  },
  details: {
    includes: [
      "Calendario del mes con días de la semana automáticos",
      "Códigos con lista desplegable y colores",
      "Conteo de asistencias, ausencias, tardanzas y permisos",
      "Porcentaje de asistencia por empleado",
    ],
    audience: ["Negocios con personal", "Supervisores de turno"],
  },
});
