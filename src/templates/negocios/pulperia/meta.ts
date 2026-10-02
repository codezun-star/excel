import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "pulperia",
  title: "Control de pulpería",
  shortDescription:
    "Ventas del día, compras a proveedores, fiados y ganancia diaria en un solo archivo, con el efectivo que debe haber en caja.",
  category: "negocios",
  businessTypes: ["pulperia"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de pulpería en Excel gratis: ventas, compras y fiados | Excel Codezun",
    description:
      "Plantilla gratis para pulperías en Honduras: ventas diarias, compras a proveedores, fiados, ganancia estimada y efectivo en caja, todo en un archivo.",
    keywords: [
      "control de pulpería excel",
      "ventas diarias pulpería",
      "plantilla para pulpería",
      "ganancia diaria negocio",
      "control de fiados y compras",
    ],
  },
  details: {
    includes: [
      "Hoja diaria del mes: ventas en efectivo y transferencia, fiado, compras y gastos",
      "Ganancia estimada del día con tu margen promedio",
      "Efectivo que debe haber en caja cada día",
      "Compras a proveedores, fiados y abonos con saldo por cliente",
    ],
    audience: ["Pulperías y mini súper", "Tiendas de barrio y abarroterías"],
  },
});
