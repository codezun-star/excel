import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "ventas-por-vendedor-comisiones",
  title: "Ventas por vendedor y comisiones",
  shortDescription:
    "Ventas de cada vendedor contra su meta mensual, porcentaje de cumplimiento y comisión con tasa escalonada.",
  category: "facturacion",
  businessTypes: ["comercio", "ferreteria", "farmacia", "tienda-ropa", "servicios"],
  tier: "pro",
  details: {
    includes: [
      "Registro de ventas por vendedor",
      "Metas y porcentajes de comisión por vendedor",
      "Cumplimiento de meta con colores y comisión del mes",
      "Tasa mayor automática al superar la meta",
    ],
    audience: ["Negocios con equipo de ventas", "Distribuidoras y tiendas con comisionistas"],
  },
});
