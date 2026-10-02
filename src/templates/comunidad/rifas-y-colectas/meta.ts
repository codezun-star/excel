import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "rifas-y-colectas",
  title: "Rifas y colectas",
  shortDescription:
    "Control de boletos por número, vendedor y comprador, cobros pendientes, donaciones, gastos del premio y ganancia neta frente a la meta.",
  category: "comunidad",
  businessTypes: ["iglesia-ong", "escuela", "hogar"],
  tier: "free",
  seo: {
    title: "Control de rifas en Excel gratis: boletos, vendedores y ganancia | Excel Codezun",
    description:
      "Plantilla gratis para rifas, colectas y actividades pro fondos: boletos vendidos y pagados, vendedores, donaciones, gastos y meta.",
    keywords: [
      "control de rifa excel",
      "formato de rifa números",
      "colecta pro fondos",
      "actividad pro fondos honduras",
    ],
  },
  details: {
    includes: [
      "Lista de boletos numerados con vendedor, comprador y estado de pago",
      "Resumen por vendedor: boletos vendidos, cobrado y pendiente",
      "Registro de donaciones y de gastos (premios, impresión, publicidad)",
      "Ganancia neta y avance frente a la meta de la actividad",
    ],
    audience: [
      "Iglesias, escuelas y patronatos que hacen actividades pro fondos",
      "Grupos de amigos, equipos y comités de colecta",
    ],
  },
});
