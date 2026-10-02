import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "costos-de-producto",
  title: "Costos de producto",
  shortDescription:
    "Costo unitario real con materiales por lote, mano de obra, empaque y gastos indirectos; precio sugerido según tu margen, precio con ISV y margen real frente a la competencia.",
  category: "emprendedores",
  businessTypes: ["comercio", "cafeteria-panaderia", "restaurante", "freelancer"],
  tier: "free",
  seo: {
    title: "Calcular costo de producto y precio de venta en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para emprendedores: costo de materiales por lote, mano de obra, empaque, gastos indirectos, precio sugerido y precio con ISV.",
    keywords: [
      "costo de producto excel",
      "cómo calcular precio de venta",
      "costeo de productos emprendimiento",
      "precio con isv honduras",
    ],
  },
  details: {
    includes: [
      "Materiales por producto con el precio del empaque y lo que usas por lote",
      "Mano de obra por minutos y gastos indirectos repartidos por unidad",
      "Costo unitario, precio sugerido según el margen y precio con ISV",
      "Margen real de tu precio y comparación con la competencia",
    ],
    audience: [
      "Panaderías, reposterías y comida para vender",
      "Artesanos, costureras, fabricantes de jabones, velas y productos hechos a mano",
    ],
  },
});
