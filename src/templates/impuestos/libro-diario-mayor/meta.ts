import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "libro-diario-mayor",
  title: "Libro diario y mayor",
  shortDescription:
    "Partidas contables con validación de cuadre, mayorización automática por cuenta y balanza de comprobación.",
  category: "impuestos",
  tier: "pro",
  regulated: "fiscal",
  details: {
    includes: [
      "Libro diario con número de partida, cuenta, concepto, debe y haber",
      "Nombre de la cuenta automático desde el catálogo",
      "Alerta de partidas descuadradas",
      "Libro mayor y balanza de comprobación por cuenta con saldos según naturaleza",
    ],
    audience: [
      "Contadores",
      "Estudiantes de contabilidad",
      "Pequeñas empresas con contabilidad propia",
    ],
  },
});
