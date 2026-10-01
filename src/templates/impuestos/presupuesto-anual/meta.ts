import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "presupuesto-anual",
  title: "Presupuesto anual",
  shortDescription:
    "Presupuesto de ingresos y gastos por mes comparado contra lo real registrado, con variación y porcentaje de ejecución.",
  category: "impuestos",
  businessTypes: ["comercio", "servicios", "iglesia-ong", "escuela", "constructora"],
  tier: "free",
  details: {
    includes: [
      "Presupuesto mensual por categoría de ingresos y gastos",
      "Registro de movimientos reales",
      "Comparación presupuesto contra real por categoría y por mes",
      "Variación y porcentaje de ejecución con colores",
    ],
    audience: ["Empresas y ONG que trabajan con presupuesto", "Administradores"],
  },
});
