import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "activos-fijos-depreciacion",
  title: "Activos fijos y depreciación",
  shortDescription:
    "Registro de activos fijos con depreciación en línea recta mensual, acumulada a la fecha de corte, valor en libros y resumen por categoría.",
  category: "impuestos",
  tier: "pro",
  regulated: "fiscal",
  details: {
    includes: [
      "Vida útil sugerida por categoría (editable en Parámetros)",
      "Depreciación anual y mensual en línea recta con valor residual",
      "Depreciación acumulada y valor en libros a cualquier fecha",
      "Resumen por categoría para el registro contable",
    ],
    audience: ["Contadores", "Empresas con mobiliario, vehículos y equipo"],
  },
});
