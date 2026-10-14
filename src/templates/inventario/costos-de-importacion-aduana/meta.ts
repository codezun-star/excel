import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "costos-de-importacion-aduana",
  title: "Costos de importación y aduana",
  shortDescription:
    "Costo puesto en bodega de cada producto importado: FOB, flete, seguro, valor CIF, DAI, selectivo, ISV y gastos de aduana prorrateados.",
  category: "inventario",
  businessTypes: ["comercio", "ferreteria", "tienda-ropa", "farmacia"],
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  seo: {
    title: "Costos de importación y aduana en Excel (Honduras) | Excel Codezun",
    description:
      "Calcula en Excel el costo de tus importaciones: valor CIF, DAI, selectivo, ISV, gastos de agente aduanero y transporte prorrateados y costo unitario en bodega.",
    keywords: [
      "costo de importacion excel",
      "calculo dai honduras",
      "valor cif excel",
      "costo puesto en bodega",
    ],
  },
  details: {
    includes: [
      "Productos con partida arancelaria, cantidad, peso y precio FOB en dólares",
      "Flete, seguro y gastos locales prorrateados por valor o por peso",
      "Valor CIF, DAI, impuesto selectivo e ISV de importación por producto",
      "Costo unitario puesto en bodega y precio de venta sugerido según tu margen",
      "Liquidación con impuestos en aduana, crédito fiscal y factor de importación",
    ],
    audience: ["Importadores y comercios que compran en el extranjero", "Agentes aduaneros"],
  },
});
