import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "reporte-de-ventas",
  title: "Reporte de ventas",
  shortDescription:
    "Registro diario de ventas con resumen automático por mes, categoría, forma de pago y vendedor.",
  category: "facturacion",
  businessTypes: ALL_SHOPS,
  tier: "free",
  featured: true,
  seo: {
    title: "Reporte de ventas en Excel gratis: diario, mensual y por producto | Excel Codezun",
    description:
      "Plantilla gratis de reporte de ventas en Excel: registra cada venta y obtén totales por mes, categoría, forma de pago y vendedor automáticamente.",
    keywords: [
      "reporte de ventas excel",
      "control de ventas diarias",
      "registro de ventas excel",
      "ventas mensuales excel",
    ],
  },
  details: {
    includes: [
      "Hoja de ventas con fecha, cliente, producto, categoría, cantidad y precio",
      "Totales por mes con número de ventas y ticket promedio",
      "Ventas por categoría y por forma de pago con porcentaje",
      "Ventas por vendedor (opcional)",
      "Listas editables de categorías, formas de pago y vendedores",
    ],
    audience: [
      "Pulperías, tiendas y comercios",
      "Emprendedores que venden por redes",
      "Negocios con varios vendedores",
    ],
  },
});
