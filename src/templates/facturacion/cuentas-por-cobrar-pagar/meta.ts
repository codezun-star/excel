import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "cuentas-por-cobrar-pagar",
  title: "Cuentas por cobrar y por pagar",
  shortDescription:
    "Facturas al crédito de clientes y proveedores con abonos, saldos, vencimientos y antigüedad de saldos automática.",
  category: "facturacion",
  businessTypes: [...ALL_SHOPS, "servicios", "constructora"],
  tier: "free",
  seo: {
    title:
      "Cuentas por cobrar y por pagar en Excel gratis con antigüedad de saldos | Excel Codezun",
    description:
      "Plantilla gratis de cuentas por cobrar y por pagar en Excel: abonos, saldos, días vencidos, estado y antigüedad de saldos (30, 60, 90 días).",
    keywords: [
      "cuentas por cobrar excel",
      "cuentas por pagar excel",
      "antigüedad de saldos excel",
      "control de créditos",
    ],
  },
  details: {
    includes: [
      "Documentos al crédito con fecha, días de crédito y vencimiento",
      "Registro de abonos que descuenta el saldo de cada documento",
      "Días vencidos y estado (al día, vencido, pagado) con colores",
      "Antigüedad de saldos: al día, 1-30, 31-60, 61-90 y más de 90 días",
    ],
    audience: ["Negocios que venden o compran al crédito", "Distribuidores y mayoristas"],
  },
});
