import { defineMeta } from "@/templates/define";
import { ALL_EMPLOYERS } from "@/templates/categories";

export const meta = defineMeta({
  slug: "evaluacion-de-desempeno",
  title: "Evaluación de desempeño",
  shortDescription:
    "Evaluación por competencias con escala de 1 a 5, pesos editables, puntaje ponderado y calificación final por empleado.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  tier: "free",
  seo: {
    title: "Formato de evaluación de desempeño en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis de evaluación de desempeño por competencias: escala 1 a 5, pesos, puntaje ponderado y calificación de cada empleado.",
    keywords: [
      "evaluación de desempeño excel",
      "formato evaluación de personal",
      "evaluación por competencias",
      "evaluación de empleados",
    ],
  },
  details: {
    includes: [
      "Competencias a tu medida con su peso",
      "Escala de 1 a 5 con lista desplegable",
      "Puntaje ponderado y calificación (Excelente a Deficiente)",
      "Promedio del equipo y mejor puntaje",
    ],
    audience: ["Empresas y negocios con personal", "Encargados de recursos humanos"],
  },
});
