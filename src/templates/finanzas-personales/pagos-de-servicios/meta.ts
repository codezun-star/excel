import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "pagos-de-servicios",
  title: "Pagos de servicios del hogar",
  shortDescription:
    "Energía, agua, internet, teléfono, cable y más: día de vencimiento, pagos de cada mes, estado del mes actual y gasto anual por servicio.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  seo: {
    title: "Control de pagos de servicios (luz, agua, internet) en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para controlar pagos de energía, agua, internet, teléfono y otros servicios: vencimientos, pagos por mes y alertas.",
    keywords: [
      "control de pagos de servicios",
      "pago de luz y agua excel",
      "recordatorio de pagos",
      "gastos fijos del hogar",
    ],
  },
  details: {
    includes: [
      "Servicios con proveedor, número de contrato y día de vencimiento",
      "Pagos de los 12 meses en una sola tabla",
      "Estado del mes actual: pagado, pendiente o vencido",
      "Total y promedio mensual por servicio y total por mes",
    ],
    audience: ["Hogares y familias", "Quien administra pagos de padres o de una casa alquilada"],
  },
});
