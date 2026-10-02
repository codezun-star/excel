import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "pedidos-y-entregas",
  title: "Pedidos y entregas",
  shortDescription:
    "Seguimiento de pedidos con fecha de entrega, estado, anticipos, saldo por cobrar y alertas de entregas atrasadas o para hoy.",
  category: "inventario",
  businessTypes: ["comercio", "cafeteria-panaderia", "restaurante", "tienda-ropa"],
  tier: "free",
  seo: {
    title: "Control de pedidos y entregas en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para llevar pedidos de clientes: fecha de entrega, estado, anticipo, saldo pendiente y alertas de pedidos atrasados.",
    keywords: [
      "control de pedidos excel",
      "registro de pedidos",
      "pedidos y entregas",
      "control de anticipos clientes",
    ],
  },
  details: {
    includes: [
      "Número de pedido correlativo, cliente, teléfono y detalle",
      "Total, anticipo, pagos y saldo por cobrar",
      "Estado del pedido y días para entregar",
      "Resumen: pendientes, para hoy, atrasados y total por cobrar",
    ],
    audience: [
      "Panaderías y reposterías por encargo",
      "Tiendas, costureras y talleres que trabajan por pedido",
    ],
  },
});
