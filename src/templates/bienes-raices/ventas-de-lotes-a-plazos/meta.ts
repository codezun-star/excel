import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "ventas-de-lotes-a-plazos",
  title: "Venta de lotes a plazos",
  shortDescription:
    "Para lotificadoras y proyectos: inventario de lotes por varas o metros, contratos con prima y cuotas, pagos, estado de cuenta con amortización, mora y cartera.",
  category: "bienes-raices",
  businessTypes: ["inmobiliaria", "constructora"],
  tier: "pro",
  seo: {
    title: "Control de venta de lotes a plazos en Excel (lotificadora) | Excel Codezun",
    description:
      "Plantilla Pro para lotificadoras en Honduras: lotes disponibles y vendidos, prima, cuotas con o sin interés, pagos, mora, estado de cuenta y cartera.",
    keywords: [
      "control de lotes a plazos excel",
      "lotificadora excel",
      "venta de terrenos al crédito",
      "estado de cuenta de lote",
    ],
  },
  details: {
    includes: [
      "Inventario de lotes con área, precio por vara o metro cuadrado y estado",
      "Contratos con prima, monto financiado, tasa, plazo y cuota mensual",
      "Registro de pagos por contrato con cuotas vencidas, atraso y saldo",
      "Estado de cuenta con tabla de amortización y cuotas pagadas o vencidas",
      "Resumen de cartera, morosidad, cobros y ventas por mes",
    ],
    audience: [
      "Lotificadoras y desarrolladores de residenciales",
      "Dueños de terrenos que venden lotes al crédito",
    ],
  },
});
