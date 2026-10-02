import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "metas-de-ventas",
  title: "Metas de ventas",
  shortDescription:
    "Metas mensuales por vendedor, sucursal o canal contra las ventas reales, cumplimiento con semáforo, acumulado del año y proyección del mes en curso.",
  category: "emprendedores",
  businessTypes: ["comercio", "servicios", "tienda-ropa", "ferreteria", "farmacia"],
  tier: "free",
  seo: {
    title: "Metas de ventas en Excel gratis: cumplimiento por vendedor | Excel Codezun",
    description:
      "Plantilla gratis para fijar metas de ventas por mes y vendedor, registrar ventas y ver el cumplimiento con semáforo y proyección del mes.",
    keywords: [
      "metas de ventas excel",
      "cumplimiento de metas de ventas",
      "control de ventas por vendedor",
      "proyección de ventas del mes",
    ],
  },
  details: {
    includes: [
      "Metas de los 12 meses por vendedor, sucursal o canal",
      "Registro de ventas con fecha, vendedor, cliente y monto",
      "Ventas reales y porcentaje de cumplimiento por mes con semáforo",
      "Mes en curso: avance, proyección al cierre y cuánto falta vender por día",
    ],
    audience: ["Dueños y gerentes de ventas", "Negocios con varios vendedores, rutas o sucursales"],
  },
});
