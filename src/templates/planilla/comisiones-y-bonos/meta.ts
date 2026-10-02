import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "comisiones-y-bonos",
  title: "Comisiones y bonos",
  shortDescription:
    "Comisiones escalonadas por tramos de venta, bono por cumplimiento de meta y comisión extra sobre el excedente, con total a pagar por vendedor.",
  category: "planilla",
  businessTypes: ["comercio", "servicios", "tienda-ropa", "ferreteria"],
  tier: "pro",
  seo: {
    title: "Cálculo de comisiones y bonos en Excel | Excel Codezun",
    description:
      "Plantilla para calcular comisiones escalonadas por tramos, bonos por cumplimiento de metas y total a pagar a cada vendedor.",
    keywords: [
      "cálculo de comisiones excel",
      "comisiones escalonadas",
      "bono por cumplimiento de metas",
      "comisiones de vendedores",
    ],
  },
  details: {
    includes: [
      "Tabla de tramos editable (ventas desde y % de comisión)",
      "Porcentaje de cumplimiento de la meta de cada vendedor",
      "Bono fijo al alcanzar el cumplimiento mínimo y comisión extra sobre el excedente",
      "Salario base, comisión, bonos y total a pagar",
    ],
    audience: ["Tiendas, distribuidoras y empresas con vendedores", "Gerentes de ventas"],
  },
});
