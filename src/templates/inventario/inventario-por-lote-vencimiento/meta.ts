import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "inventario-por-lote-vencimiento",
  title: "Inventario por lote y vencimiento",
  shortDescription:
    "Existencias por lote con fecha de vencimiento, días restantes, alertas de productos vencidos o por vencer y valor en riesgo.",
  category: "inventario",
  businessTypes: ["farmacia", "pulperia", "comercio", "cafeteria-panaderia"],
  tier: "pro",
  seo: {
    title: "Control de vencimientos e inventario por lote en Excel | Excel Codezun",
    description:
      "Plantilla de inventario por lote con fechas de vencimiento: alertas de productos vencidos y por vencer, salidas por lote y valor en riesgo.",
    keywords: [
      "control de vencimientos excel",
      "inventario por lote",
      "productos por vencer",
      "inventario farmacia excel",
    ],
  },
  details: {
    includes: [
      "Lotes con producto, fecha de vencimiento, costo y cantidad recibida",
      "Salidas por lote (venta, merma o devolución)",
      "Días para vencer y estado: vencido, por vencer u OK",
      "Valor del inventario y valor en riesgo de vencer",
    ],
    audience: ["Farmacias y droguerías", "Pulperías, panaderías y comercios con perecederos"],
  },
});
