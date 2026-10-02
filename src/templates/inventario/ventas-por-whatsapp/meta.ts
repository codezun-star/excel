import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "ventas-por-whatsapp",
  title: "Ventas por WhatsApp y redes",
  shortDescription:
    "Registro de pedidos por WhatsApp, Facebook, Instagram y TikTok con envíos, pagos pendientes, ventas por canal y clientes frecuentes.",
  category: "inventario",
  businessTypes: ["comercio", "tienda-ropa", "cafeteria-panaderia"],
  tier: "free",
  seo: {
    title: "Control de ventas por WhatsApp en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para vender por WhatsApp y redes sociales: pedidos, envíos, pagos por transferencia o contra entrega, ventas por canal y clientes frecuentes.",
    keywords: [
      "ventas por whatsapp excel",
      "control de pedidos redes sociales",
      "registro de ventas facebook",
      "control de envíos y pagos",
    ],
  },
  details: {
    includes: [
      "Pedidos con canal, producto, envío, forma de pago y estado de entrega",
      "Pagos pendientes (contra entrega o transferencia sin confirmar)",
      "Ventas y pedidos por canal y por mes",
      "Clientes frecuentes con número de compras y total comprado",
    ],
    audience: [
      "Emprendedores que venden por WhatsApp y redes",
      "Tiendas en línea con envíos a domicilio",
    ],
  },
});
