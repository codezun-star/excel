import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "lista-del-super",
  title: "Lista del súper",
  shortDescription:
    "Lista de compras por pasillo con cantidades, precio estimado y real, casilla de comprado, total contra presupuesto y gasto por pasillo.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  seo: {
    title: "Lista del súper en Excel gratis con precios y presupuesto | Excel Codezun",
    description:
      "Plantilla gratis de lista de compras para el supermercado: productos por pasillo, precio estimado y real, total y control del presupuesto.",
    keywords: [
      "lista del súper excel",
      "lista de compras supermercado",
      "lista de mandado",
      "presupuesto de compras",
    ],
  },
  details: {
    includes: [
      "Productos ordenados por pasillo",
      "Cantidad, precio estimado y precio real",
      "Marca lo que ya compraste",
      "Total estimado, total real y diferencia con tu presupuesto",
    ],
    audience: [
      "Familias que quieren gastar menos en el súper",
      "Quien hace las compras de la quincena",
    ],
  },
});
