import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "salario-minimo",
  title: "Salario mínimo",
  shortDescription:
    "Tabla del salario mínimo por rama de actividad y tamaño de empresa, con verificador para saber si cada empleado gana el mínimo.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "free",
  regulated: "laboral",
  featured: true,
  seo: {
    title: "Tabla de salario mínimo Honduras 2026 en Excel con verificador | Excel Codezun",
    description:
      "Descarga gratis la tabla del salario mínimo de Honduras por rama de actividad y número de empleados, con valores diarios, por hora y un verificador por empleado.",
    keywords: [
      "salario minimo honduras 2026",
      "tabla salario minimo excel",
      "salario minimo por rama de actividad",
    ],
  },
  details: {
    includes: [
      "Tabla mensual por rama de actividad y tamaño de empresa",
      "Equivalentes diario y por hora",
      "Verificador por empleado con diferencia y cumplimiento",
    ],
    audience: ["Empleadores", "Trabajadores", "Departamentos de recursos humanos"],
  },
});
