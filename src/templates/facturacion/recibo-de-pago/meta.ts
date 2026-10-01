import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "recibo-de-pago",
  title: "Recibo de pago",
  shortDescription:
    "Talonario de recibos numerados con monto en letras automático, concepto, forma de pago y registro de todos los recibos.",
  category: "facturacion",
  businessTypes: [...ALL_SHOPS, "servicios", "escuela", "iglesia-ong", "inmobiliaria"],
  tier: "free",
  featured: true,
  seo: {
    title: "Recibo de pago en Excel gratis con monto en letras | Excel Codezun",
    description:
      "Descarga gratis un talonario de recibos de pago en Excel: numeración automática, cantidad en letras, concepto y registro de recibos emitidos.",
    keywords: [
      "recibo de pago excel",
      "formato de recibo",
      "recibo con cantidad en letras",
      "talonario de recibos excel",
    ],
  },
  details: {
    includes: [
      "Varios recibos por hoja listos para imprimir y recortar",
      "Numeración consecutiva automática con prefijo",
      "Cantidad en letras calculada a partir del monto",
      "Registro automático de todos los recibos con total cobrado",
    ],
    audience: ["Negocios, escuelas e iglesias", "Arrendadores y profesionales independientes"],
  },
});
