import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "ferreteria",
  title: "Control de ferretería",
  shortDescription:
    "Inventario por categoría con alerta de mínimo, cotización rápida con ISV y ventas al crédito con vencimientos y saldo por cliente.",
  category: "negocios",
  businessTypes: ["ferreteria"],
  tier: "free",
  seo: {
    title: "Control de ferretería en Excel gratis: inventario y cotizaciones | Excel Codezun",
    description:
      "Plantilla gratis para ferreterías: inventario por categoría con mínimos, cotizaciones rápidas con ISV y control de ventas al crédito.",
    keywords: [
      "control de ferretería excel",
      "inventario ferretería",
      "cotización ferretería excel",
      "ventas al crédito",
    ],
  },
  details: {
    includes: [
      "Inventario con código, categoría, costo, precio, margen y alerta de mínimo",
      "Cotización rápida: escribe el código y se llenan producto y precio",
      "ISV calculado con la tasa del país",
      "Ventas al crédito con vencimiento, abonos, saldo y días de atraso",
    ],
    audience: [
      "Ferreterías y depósitos de materiales",
      "Comercios con muchos productos y ventas al crédito",
    ],
  },
});
