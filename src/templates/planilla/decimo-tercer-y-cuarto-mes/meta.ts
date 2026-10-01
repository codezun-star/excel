import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "decimo-tercer-y-cuarto-mes",
  title: "Décimo tercer y cuarto mes",
  shortDescription:
    "Calcula el aguinaldo (décimo tercer mes) y el décimo cuarto mes completo o proporcional de cada empleado según su fecha de ingreso.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "pro",
  regulated: "laboral",
  featured: true,
  seo: {
    title: "Cálculo del décimo cuarto mes y aguinaldo en Excel (Honduras) | Excel Codezun",
    description:
      "Calcula el décimo tercer mes (aguinaldo) y el décimo cuarto mes proporcional en Excel para Honduras según la fecha de ingreso y salida de cada empleado.",
    keywords: [
      "calculo decimo cuarto mes",
      "decimo tercer mes honduras",
      "aguinaldo honduras excel",
      "decimo cuarto proporcional",
    ],
  },
  details: {
    includes: [
      "Períodos de cálculo del décimo tercer y del décimo cuarto mes según la ley",
      "Días trabajados en cada período con base comercial de 360 días",
      "Monto proporcional para quienes ingresaron o salieron durante el período",
      "Totales a pagar por concepto",
    ],
    audience: [
      "Empresas y contadores al preparar el pago de junio y diciembre",
      "Trabajadores que quieren verificar su pago",
    ],
  },
});
