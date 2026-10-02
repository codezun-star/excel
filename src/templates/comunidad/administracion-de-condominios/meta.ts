import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "administracion-de-condominios",
  title: "Administración de condominios",
  shortDescription:
    "Presupuesto de gastos comunes, cuota por alícuota o fija, fondo de reserva, pagos por unidad, morosidad, estado de cuenta y ejecución del presupuesto.",
  category: "comunidad",
  businessTypes: ["inmobiliaria", "hogar"],
  tier: "pro",
  seo: {
    title: "Administración de condominios en Excel: cuotas, alícuotas y morosos | Excel Codezun",
    description:
      "Plantilla Pro para residenciales y condominios en Honduras: presupuesto, cuota por alícuota, fondo de reserva, pagos, mora y estado de cuenta.",
    keywords: [
      "administración de condominios excel",
      "cuota de mantenimiento residencial",
      "alícuota condominio",
      "control de morosos residencial",
    ],
  },
  details: {
    includes: [
      "Presupuesto mensual de gastos comunes con fondo de reserva",
      "Cuota por unidad calculada por alícuota (área) o cuota fija",
      "Pagos mes a mes por unidad, saldo pendiente y morosos resaltados",
      "Estado de cuenta por unidad con recargo por mora",
      "Ejecución del presupuesto: presupuestado contra gasto real por categoría",
    ],
    audience: [
      "Juntas directivas y administradores de residenciales y condominios",
      "Edificios de apartamentos y locales comerciales",
    ],
  },
});
