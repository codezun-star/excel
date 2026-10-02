import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "inventario-stock-minimo",
  title: "Inventario con stock mínimo",
  shortDescription:
    "Control de existencias con entradas y salidas, alertas de reorden y productos agotados, y valor total del inventario.",
  category: "inventario",
  businessTypes: ALL_SHOPS,
  tier: "free",
  featured: true,
  seo: {
    title: "Control de inventario en Excel gratis con stock mínimo y alertas | Excel Codezun",
    description:
      "Plantilla gratis de inventario en Excel: entradas, salidas, existencias, stock mínimo con alertas de reorden y valor del inventario.",
    keywords: [
      "control de inventario excel",
      "inventario stock minimo",
      "plantilla inventario gratis",
      "entradas y salidas de inventario",
    ],
  },
  details: {
    includes: [
      "Catálogo de productos con costo, precio y stock mínimo",
      "Registro de entradas y salidas que actualiza las existencias",
      "Estado de cada producto: OK, reordenar o agotado (con colores)",
      "Valor del inventario al costo y al precio de venta",
    ],
    audience: ["Pulperías, ferreterías, farmacias y tiendas", "Emprendedores con productos"],
  },
});
