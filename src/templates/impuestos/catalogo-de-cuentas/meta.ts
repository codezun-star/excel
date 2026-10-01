import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "catalogo-de-cuentas",
  title: "Catálogo de cuentas",
  shortDescription:
    "Catálogo contable base para pequeñas empresas con niveles, tipo, naturaleza y estado financiero de cada cuenta, listo para adaptar.",
  category: "impuestos",
  tier: "free",
  details: {
    includes: [
      "Más de 70 cuentas organizadas en grupos, subgrupos y cuentas de mayor",
      "Nivel, tipo, naturaleza y estado financiero calculados desde el código",
      "Cuentas de ISV, IHSS y RAP incluidas",
      "Filas libres para agregar subcuentas",
    ],
    audience: ["Contadores", "Emprendedores que inician su contabilidad"],
  },
});
