import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "pagos-de-academias",
  title: "Pagos de academias",
  shortDescription:
    "Cursos con su inscripción y mensualidad, alumnos con descuento o beca, pagos por mes, morosos, materiales, gastos y resultado de la academia.",
  category: "educacion",
  businessTypes: ["escuela", "servicios"],
  tier: "free",
  seo: {
    title: "Control de pagos de academia en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para academias de inglés, música, danza, fútbol y reforzamiento: inscripciones, mensualidades, becas, materiales y morosos.",
    keywords: [
      "control de pagos academia excel",
      "mensualidades de academia",
      "control de alumnos academia de inglés",
      "escuela de fútbol pagos",
    ],
  },
  details: {
    includes: [
      "Cursos con inscripción, mensualidad y costo de materiales",
      "Alumnos por curso con descuento o beca: la cuota se calcula sola",
      "Pagos mes a mes, saldo pendiente y morosos resaltados",
      "Cobros de materiales, uniformes y eventos",
      "Resumen por curso y resultado mensual con los gastos",
    ],
    audience: [
      "Academias de inglés, música, danza, arte y computación",
      "Escuelas de fútbol, natación y clases de reforzamiento",
    ],
  },
});
