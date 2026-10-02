import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "cafeteria-panaderia",
  title: "Control de cafetería y panadería",
  shortDescription:
    "Producción diaria por producto, vendido, mermas, costo de producción, compras de insumos, ventas y ganancia del día y del mes.",
  category: "negocios",
  businessTypes: ["cafeteria-panaderia"],
  tier: "free",
  seo: {
    title: "Control de producción y mermas para panadería en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para panaderías y cafeterías: producción diaria, vendidos, mermas, costo de producción, compras de insumos y ganancia.",
    keywords: [
      "control de panadería excel",
      "producción diaria panadería",
      "control de mermas",
      "costos cafetería excel",
    ],
  },
  details: {
    includes: [
      "Productos con precio de venta y costo unitario de producción",
      "Registro diario: producido, vendido, merma y ganancia por producto",
      "Compras de insumos por día",
      "Resumen por día y por producto con porcentaje de merma",
    ],
    audience: ["Panaderías y reposterías", "Cafeterías y negocios de comida rápida"],
  },
});
