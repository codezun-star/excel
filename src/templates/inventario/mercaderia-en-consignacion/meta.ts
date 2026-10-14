import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "mercaderia-en-consignacion",
  title: "Mercadería en consignación",
  shortDescription:
    "Productos entregados o recibidos en consignación: ventas reportadas, devoluciones, comisión, liquidaciones y saldo por tienda o proveedor.",
  category: "inventario",
  businessTypes: ["comercio", "tienda-ropa", "farmacia", "cafeteria-panaderia"],
  tier: "pro",
  seo: {
    title: "Control de mercadería en consignación en Excel | Excel Codezun",
    description:
      "Plantilla de Excel para mercadería en consignación: entregas, ventas, devoluciones, comisión, unidades en cada tienda y saldo por liquidar.",
    keywords: [
      "mercaderia en consignacion excel",
      "control de consignacion",
      "liquidacion de consignacion",
      "inventario en consignacion",
    ],
  },
  details: {
    includes: [
      "Modo para quien entrega mercadería o para quien la recibe a consignación",
      "Movimientos de entrega, venta y devolución con precio y comisión",
      "Unidades y valor en consignación por tienda o proveedor y por producto",
      "Liquidaciones pagadas o cobradas y saldo pendiente, con consulta por producto",
    ],
    audience: [
      "Productores y distribuidores que dejan producto en tiendas",
      "Tiendas que venden mercadería de terceros",
    ],
  },
});
