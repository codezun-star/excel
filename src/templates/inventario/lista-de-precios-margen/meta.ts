import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "lista-de-precios-margen",
  title: "Lista de precios con margen",
  shortDescription:
    "Calcula el precio de venta desde el costo con el margen deseado, agrega el ISV según la tasa y redondea a precios fáciles de cobrar.",
  category: "inventario",
  businessTypes: ALL_SHOPS,
  tier: "free",
  details: {
    includes: [
      "Precio sin ISV a partir del costo y el margen (sobre precio o sobre costo)",
      "ISV por producto con la tasa que corresponda",
      "Precio final redondeado y ganancia por unidad",
      "Margen real después del redondeo",
    ],
    audience: ["Tiendas, ferreterías, farmacias y distribuidores"],
  },
});
