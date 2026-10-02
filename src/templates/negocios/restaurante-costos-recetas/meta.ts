import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "restaurante-costos-recetas",
  title: "Costos de recetas para restaurante",
  shortDescription:
    "Costo por porción de cada platillo con insumos, mermas y conversiones, food cost, precio sugerido con y sin ISV y margen.",
  category: "negocios",
  businessTypes: ["restaurante", "cafeteria-panaderia"],
  tier: "pro",
  seo: {
    title: "Costeo de recetas y platillos en Excel | Excel Codezun",
    description:
      "Plantilla para restaurantes: costo por porción de cada platillo con mermas, food cost, precio sugerido con ISV y margen de ganancia.",
    keywords: [
      "costeo de recetas excel",
      "costo por porción",
      "food cost restaurante",
      "precio de venta platillos",
    ],
  },
  details: {
    includes: [
      "Insumos con costo de compra, conversión a unidad de uso y merma",
      "Recetas por platillo con cantidad por porción de cada insumo",
      "Costo por porción, food cost y margen de cada platillo",
      "Precio sugerido según tu food cost objetivo, con y sin ISV",
    ],
    audience: [
      "Restaurantes, comedores y cafeterías",
      "Panaderías y negocios de comida por encargo",
    ],
  },
});
