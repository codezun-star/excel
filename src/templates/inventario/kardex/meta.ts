import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "kardex",
  title: "Kardex",
  shortDescription:
    "Tarjeta kardex por producto con método de costo promedio ponderado: entradas, salidas, saldos en unidades y en valor.",
  category: "inventario",
  businessTypes: ALL_SHOPS,
  tier: "free",
  seo: {
    title: "Kardex en Excel gratis (promedio ponderado) | Excel Codezun",
    description:
      "Descarga gratis un kardex en Excel con costo promedio ponderado: entradas, salidas, saldo en unidades, costo promedio y valor del inventario.",
    keywords: [
      "kardex excel",
      "kardex promedio ponderado",
      "tarjeta kardex",
      "control de inventario kardex",
    ],
  },
  details: {
    includes: [
      "Saldo inicial en unidades y costo",
      "Entradas con costo de compra y salidas valuadas al costo promedio",
      "Saldo, costo promedio y valor actualizados en cada movimiento",
      "Una hoja por producto (puedes duplicarla)",
    ],
    audience: ["Contadores y auxiliares", "Negocios que necesitan costear su inventario"],
  },
});
