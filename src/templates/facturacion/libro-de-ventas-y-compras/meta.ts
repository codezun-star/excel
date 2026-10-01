import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "libro-de-ventas-y-compras",
  title: "Libro de ventas y compras",
  shortDescription:
    "Libro mensual de facturas emitidas y recibidas con importes exentos, gravados 15 % y 18 %, ISV y resumen de débito y crédito fiscal.",
  category: "facturacion",
  businessTypes: ALL_SHOPS,
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  featured: true,
  seo: {
    title: "Libro de ventas y compras en Excel (Honduras) con ISV 15 % y 18 % | Excel Codezun",
    description:
      "Libro de ventas y libro de compras en Excel para Honduras: importes exentos y gravados, ISV 15 % y 18 %, débito y crédito fiscal del mes.",
    keywords: [
      "libro de ventas excel honduras",
      "libro de compras isv",
      "registro de compras y ventas sar",
      "credito fiscal isv",
    ],
  },
  details: {
    includes: [
      "Libro de ventas con cliente, RTN, importes exentos y gravados por tasa",
      "Libro de compras con proveedor, RTN y crédito fiscal",
      "ISV calculado por tasa con las tasas vigentes de la hoja Parámetros",
      "Resumen de débito fiscal, crédito fiscal e ISV del período",
    ],
    audience: ["Contadores", "Comercios inscritos en el régimen del ISV"],
  },
});
