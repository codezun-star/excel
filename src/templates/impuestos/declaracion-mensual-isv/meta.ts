import { ALL_SHOPS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "declaracion-mensual-isv",
  title: "Declaración mensual del ISV",
  shortDescription:
    "Hoja de trabajo para calcular el débito y el crédito fiscal, aplicar saldos a favor y retenciones y obtener el ISV a pagar del mes.",
  category: "impuestos",
  businessTypes: ALL_SHOPS,
  countries: ["HN"],
  tier: "pro",
  regulated: "fiscal",
  featured: true,
  seo: {
    title: "Cálculo de la declaración mensual del ISV en Excel (Honduras) | Excel Codezun",
    description:
      "Calcula tu declaración mensual del ISV en Excel: ventas y compras gravadas al 15 % y 18 %, débito y crédito fiscal, saldo a favor, retenciones e ISV a pagar.",
    keywords: [
      "declaracion isv excel",
      "calculo isv mensual honduras",
      "credito fiscal isv",
      "formulario 222 isv",
    ],
  },
  details: {
    includes: [
      "Ventas gravadas por tasa, exentas, exoneradas y exportaciones",
      "Compras e importaciones con derecho a crédito fiscal",
      "Ajustes por notas de crédito emitidas y recibidas",
      "Saldo a favor del período anterior y retenciones de ISV",
      "ISV a pagar o saldo a favor y fecha de vencimiento",
    ],
    audience: ["Contribuyentes del ISV", "Contadores que preparan declaraciones"],
  },
});
