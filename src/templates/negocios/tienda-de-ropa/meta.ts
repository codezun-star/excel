import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "tienda-de-ropa",
  title: "Control de tienda de ropa",
  shortDescription:
    "Inventario por prenda, talla y color con disponibles, ventas con descuento y apartados con abonos, saldo y fecha límite.",
  category: "negocios",
  businessTypes: ["tienda-ropa"],
  tier: "free",
  seo: {
    title: "Inventario de tienda de ropa por talla y color en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para tiendas de ropa y calzado: inventario por talla y color, ventas, apartados con abonos y prendas disponibles.",
    keywords: [
      "inventario tienda de ropa excel",
      "control de apartados",
      "inventario por talla y color",
      "ventas boutique excel",
    ],
  },
  details: {
    includes: [
      "Inventario con código, prenda, categoría, talla, color, costo y precio",
      "Disponibles = existencia − vendido − apartado",
      "Ventas con descuento y forma de pago",
      "Apartados con abonos, saldo, fecha límite y estado",
    ],
    audience: ["Boutiques y tiendas de ropa", "Zapaterías y tiendas de accesorios"],
  },
});
