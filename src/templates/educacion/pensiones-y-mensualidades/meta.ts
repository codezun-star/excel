import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "pensiones-y-mensualidades",
  title: "Pensiones y mensualidades",
  shortDescription:
    "Cobro de matrícula y mensualidades por alumno durante el año escolar con saldo pendiente, morosos y total recaudado.",
  category: "educacion",
  businessTypes: ["escuela"],
  tier: "free",
  seo: {
    title: "Control de mensualidades escolares en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para escuelas y colegios en Excel: matrícula y mensualidades por alumno, saldo pendiente, morosos y total recaudado.",
    keywords: ["control de mensualidades excel", "pensiones escolares", "control de pagos colegio"],
  },
  details: {
    includes: [
      "Matrícula y mensualidad por alumno (permite becas o descuentos)",
      "Pagos por mes del año escolar",
      "Saldo pendiente al mes de corte y estado",
      "Totales recaudados y por cobrar",
    ],
    audience: ["Escuelas y colegios privados", "Kínderes y academias"],
  },
});
