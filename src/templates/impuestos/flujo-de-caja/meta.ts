import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "flujo-de-caja",
  title: "Flujo de caja",
  shortDescription:
    "Proyección de 12 meses de entradas y salidas de efectivo por categoría con flujo neto, saldo acumulado y alerta de saldo negativo.",
  category: "impuestos",
  businessTypes: [...ALL_SHOPS, "servicios", "constructora", "agro"],
  tier: "free",
  featured: true,
  seo: {
    title: "Flujo de caja en Excel gratis: proyección de 12 meses | Excel Codezun",
    description:
      "Plantilla gratis de flujo de caja en Excel con ingresos y egresos por categoría, flujo neto mensual y saldo acumulado con alertas.",
    keywords: ["flujo de caja excel", "proyeccion de flujo de efectivo", "cash flow excel español"],
  },
  details: {
    includes: [
      "12 meses a partir del mes que elijas",
      "Categorías de ingresos y egresos editables",
      "Flujo neto, saldo inicial y final de cada mes",
      "Alerta en rojo si el saldo queda negativo",
    ],
    audience: [
      "Emprendedores y pequeñas empresas",
      "Quien solicita un préstamo y necesita proyecciones",
    ],
  },
});
