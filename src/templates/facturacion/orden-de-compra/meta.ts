import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "orden-de-compra",
  title: "Orden de compra",
  shortDescription:
    "Orden de compra a proveedores con fecha y lugar de entrega, ISV opcional, totales y firmas de autorización.",
  category: "facturacion",
  businessTypes: [...ALL_SHOPS, "constructora", "taller"],
  tier: "free",
  details: {
    includes: [
      "Datos de tu empresa y del proveedor",
      "Numeración con prefijo y correlativo",
      "Fecha y lugar de entrega, condición y forma de pago",
      "Líneas con fórmulas, ISV opcional y total en letras",
      "Firmas de solicitado, autorizado y recibido",
    ],
    audience: [
      "Empresas que compran a proveedores con autorización interna",
      "Ferreterías, constructoras y talleres",
    ],
  },
});
