import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "estado-de-cuenta-cliente",
  title: "Estado de cuenta de cliente",
  shortDescription:
    "Estado de cuenta con saldo inicial, cargos, abonos y saldo acumulado listo para enviar a tus clientes.",
  category: "facturacion",
  businessTypes: [...ALL_SHOPS, "servicios"],
  tier: "free",
  details: {
    includes: [
      "Encabezado con los datos de tu negocio y del cliente",
      "Período del estado de cuenta y saldo inicial",
      "Movimientos con cargos, abonos y saldo acumulado automático",
      "Saldo final con monto en letras",
    ],
    audience: [
      "Negocios que dan crédito a clientes frecuentes",
      "Proveedores de servicios mensuales",
    ],
  },
});
