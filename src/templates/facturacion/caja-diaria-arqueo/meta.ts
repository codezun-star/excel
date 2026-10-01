import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "caja-diaria-arqueo",
  title: "Caja diaria y arqueo",
  shortDescription:
    "Entradas y salidas de caja, saldo esperado y arqueo por billetes y monedas con faltante o sobrante automático.",
  category: "facturacion",
  businessTypes: [...ALL_SHOPS, "transporte", "barberia-salon"],
  tier: "free",
  featured: true,
  seo: {
    title: "Formato de arqueo de caja y caja diaria en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis de caja diaria y arqueo de caja en Excel con billetes y monedas de lempiras, saldo esperado y faltante o sobrante automático.",
    keywords: [
      "arqueo de caja excel",
      "caja diaria excel",
      "cuadre de caja",
      "formato arqueo de caja honduras",
    ],
  },
  details: {
    includes: [
      "Fondo inicial, entradas y salidas por categoría y forma de pago",
      "Saldo esperado en efectivo calculado automáticamente",
      "Arqueo por denominación de billetes y monedas del país",
      "Diferencia con alerta de faltante o sobrante",
      "Espacio para firmas de cajero y supervisor",
    ],
    audience: ["Pulperías, tiendas y restaurantes", "Negocios con varios turnos de caja"],
  },
});
