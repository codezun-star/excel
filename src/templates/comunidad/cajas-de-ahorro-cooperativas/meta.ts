import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "cajas-de-ahorro-cooperativas",
  title: "Caja de ahorro y caja rural",
  shortDescription:
    "Aportes mensuales de cada socio, préstamos internos con cuota e intereses, fondos disponibles y reparto de utilidades proporcional.",
  category: "comunidad",
  businessTypes: ["iglesia-ong", "agro"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de caja de ahorro y caja rural en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para cajas rurales y grupos de ahorro en Excel: aportes por socio, préstamos internos, intereses, fondos disponibles y reparto de utilidades.",
    keywords: [
      "caja rural excel",
      "caja de ahorro excel",
      "grupo de ahorro y prestamo",
      "control de aportaciones socios",
    ],
  },
  details: {
    includes: [
      "Aportes mensuales por socio con total ahorrado",
      "Préstamos a socios con cuota, intereses y saldo",
      "Fondos disponibles para prestar",
      "Reparto de utilidades proporcional a lo ahorrado",
    ],
    audience: [
      "Cajas rurales",
      "Grupos de ahorro comunitario y de iglesias",
      "Cooperativas pequeñas",
    ],
  },
});
