import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "prestaciones-laborales",
  title: "Prestaciones laborales",
  shortDescription:
    "Liquidación laboral: preaviso, cesantía, vacaciones, décimos proporcionales y salarios pendientes según el motivo de terminación.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "pro",
  regulated: "laboral",
  featured: true,
  seo: {
    title:
      "Cálculo de prestaciones laborales en Excel (Honduras) — preaviso y cesantía | Excel Codezun",
    description:
      "Calcula prestaciones laborales en Honduras en Excel: preaviso, auxilio de cesantía, vacaciones proporcionales, décimo tercer y cuarto mes, con finiquito listo para firmar.",
    keywords: [
      "calculo de prestaciones honduras",
      "calculo de cesantia",
      "preaviso honduras",
      "finiquito laboral excel",
    ],
  },
  details: {
    includes: [
      "Tiempo de servicio con base comercial de 360 días",
      "Preaviso y cesantía según antigüedad y motivo de terminación",
      "Vacaciones proporcionales y pendientes",
      "Décimo tercer y cuarto mes proporcionales",
      "Resumen tipo finiquito con monto en letras y espacio para firmas",
    ],
    audience: [
      "Empleadores que liquidan a un trabajador",
      "Trabajadores que quieren estimar sus prestaciones",
      "Abogados y contadores laborales",
    ],
  },
});
