import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "boleta-de-pago",
  title: "Boleta de pago",
  shortDescription:
    "Boletas individuales listas para imprimir con ingresos, deducciones de IHSS, RAP e ISR, neto a pagar en letras y firma de recibido.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "pro",
  regulated: "laboral",
  seo: {
    title: "Boleta de pago en Excel (Honduras) con IHSS, RAP e ISR | Excel Codezun",
    description:
      "Genera boletas o comprobantes de pago en Excel para Honduras: ingresos, deducciones de ley calculadas, neto en letras y firma de recibido para cada empleado.",
    keywords: [
      "boleta de pago excel",
      "comprobante de pago de salario",
      "voucher de pago honduras",
    ],
  },
  details: {
    includes: [
      "Hoja de datos con el cálculo de planilla de cada empleado",
      "Una boleta por empleado (dos por página) que se llena sola",
      "Ingresos, deducciones de ley, neto y monto en letras",
      "Espacio para la firma de recibido",
    ],
    audience: ["Empresas que entregan comprobante de pago", "Contadores"],
  },
});
