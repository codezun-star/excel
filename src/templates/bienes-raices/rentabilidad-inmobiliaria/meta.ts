import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "rentabilidad-inmobiliaria",
  title: "Rentabilidad inmobiliaria",
  shortDescription:
    "Analiza si conviene comprar una propiedad para alquilar: cuota del préstamo, flujo de caja, rentabilidad bruta y neta, cap rate, retorno del efectivo, TIR y comparador de 3 opciones.",
  category: "bienes-raices",
  businessTypes: ["inmobiliaria", "hogar"],
  tier: "pro",
  seo: {
    title:
      "Calculadora de rentabilidad inmobiliaria en Excel: flujo, cap rate y TIR | Excel Codezun",
    description:
      "Plantilla Pro para evaluar casas, apartamentos y locales para alquilar en Honduras: financiamiento, flujo de caja, cap rate, TIR y plusvalía.",
    keywords: [
      "rentabilidad inmobiliaria excel",
      "calcular cap rate",
      "inversión en bienes raíces honduras",
      "comprar para alquilar conviene",
    ],
  },
  details: {
    includes: [
      "Inversión inicial, préstamo y cuota mensual con prima y gastos de cierre",
      "Renta efectiva con vacancia, gastos operativos e ingreso neto (NOI)",
      "Rentabilidad bruta, cap rate, retorno sobre el efectivo y años para recuperar",
      "Proyección hasta 30 años con plusvalía, saldo del préstamo, patrimonio y TIR al vender",
      "Comparador de 3 propiedades lado a lado",
    ],
    audience: [
      "Inversionistas y familias que compran para alquilar",
      "Corredores que presentan oportunidades a sus clientes",
    ],
  },
});
