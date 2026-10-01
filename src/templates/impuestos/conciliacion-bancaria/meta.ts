import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "conciliacion-bancaria",
  title: "Conciliación bancaria",
  shortDescription:
    "Concilia el saldo del estado de cuenta con tus libros: depósitos en tránsito, cheques en circulación, cargos y abonos del banco.",
  category: "impuestos",
  tier: "free",
  seo: {
    title: "Formato de conciliación bancaria en Excel gratis | Excel Codezun",
    description:
      "Descarga gratis un formato de conciliación bancaria en Excel con depósitos en tránsito, cheques pendientes, notas de débito y crédito y diferencia automática.",
    keywords: [
      "conciliacion bancaria excel",
      "formato conciliacion bancaria",
      "conciliacion bancaria ejemplo",
    ],
  },
  details: {
    includes: [
      "Saldo según banco y según libros",
      "Depósitos en tránsito y cheques en circulación",
      "Notas de débito y crédito del banco no registradas y ajustes por errores",
      "Saldos conciliados y diferencia con indicador",
    ],
    audience: ["Contadores y auxiliares contables", "Negocios que manejan cuentas bancarias"],
  },
});
