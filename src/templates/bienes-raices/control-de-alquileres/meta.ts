import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "control-de-alquileres",
  title: "Control de alquileres",
  shortDescription:
    "Inquilinos, renta mensual, pagos por mes, saldo pendiente, depósitos y alerta de contratos por vencer.",
  category: "bienes-raices",
  businessTypes: ["inmobiliaria", "hogar"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de alquileres en Excel gratis: inquilinos y pagos | Excel Codezun",
    description:
      "Plantilla gratis para controlar alquileres en Excel: renta por inquilino, pagos de cada mes, morosos, depósitos y contratos por vencer.",
    keywords: [
      "control de alquileres excel",
      "control de inquilinos",
      "pagos de renta excel",
      "administracion de alquileres",
    ],
  },
  details: {
    includes: [
      "Unidades, inquilinos, renta y depósito",
      "Pagos de enero a diciembre con saldo pendiente y morosos",
      "Alerta de contratos que vencen en los próximos 30 días",
      "Total cobrado y por cobrar",
    ],
    audience: ["Dueños de cuartos, apartamentos y locales", "Administradores de propiedades"],
  },
});
