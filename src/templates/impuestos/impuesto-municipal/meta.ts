import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "impuesto-municipal",
  title: "Impuesto municipal",
  shortDescription:
    "Estimación del impuesto sobre industria, comercio y servicios por tramos, con la cuota mensual y el control de pagos a tu municipalidad.",
  category: "impuestos",
  businessTypes: [...ALL_SHOPS, "servicios", "taller", "barberia-salon"],
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  seo: {
    title: "Cálculo del impuesto municipal en Excel (Honduras) | Excel Codezun",
    description:
      "Calcula en Excel el impuesto sobre industria, comercio y servicios de tu municipalidad: tabla por millar, impuesto anual, cuota mensual y control de pagos.",
    keywords: [
      "impuesto municipal honduras",
      "impuesto sobre industria comercio y servicios",
      "calculo impuesto por millar",
      "declaracion volumen de ventas alcaldia",
    ],
  },
  details: {
    includes: [
      "Ingresos del año anterior como base y ajustes según tu municipalidad",
      "Cálculo por tramos con la tabla por millar en Parámetros",
      "Impuesto anual, cuota mensual, tasas municipales y permiso de operación",
      "Calendario de 12 pagos con vencimiento, recibo y estado",
    ],
    audience: ["Comerciantes y negocios con permiso de operación", "Contadores"],
  },
});
