import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "nota-de-credito-debito",
  title: "Nota de crédito y débito",
  shortDescription:
    "Notas de crédito o débito vinculadas a la factura original, con CAI, rango autorizado e ISV desglosado por tasa.",
  category: "facturacion",
  businessTypes: ALL_SHOPS,
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  details: {
    includes: [
      "Nota de crédito o de débito con numeración y datos SAR",
      "Referencia a la factura que modifica, su fecha y el motivo",
      "Líneas con ISV por tasa y total en letras",
      "Alertas de rango autorizado y fecha límite de emisión",
    ],
    audience: ["Negocios que hacen devoluciones, descuentos posteriores o cargos adicionales"],
  },
});
