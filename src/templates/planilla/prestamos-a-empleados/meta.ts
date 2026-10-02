import { defineMeta } from "@/templates/define";
import { ALL_EMPLOYERS } from "@/templates/categories";

export const meta = defineMeta({
  slug: "prestamos-a-empleados",
  title: "Préstamos a empleados",
  shortDescription:
    "Control de préstamos y adelantos de salario con cuotas, abonos descontados en planilla y saldo de cada empleado.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  tier: "free",
  seo: {
    title: "Control de préstamos a empleados en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para controlar préstamos y adelantos de salario a empleados: cuotas, descuentos en planilla, abonos y saldo pendiente.",
    keywords: [
      "préstamos a empleados excel",
      "control de adelantos de salario",
      "descuentos en planilla",
      "control de préstamos personal",
    ],
  },
  details: {
    includes: [
      "Préstamos y adelantos con número correlativo y cuota calculada",
      "Registro de abonos por descuento en planilla o pago directo",
      "Saldo pendiente y estado de cada préstamo",
      "Descuento a aplicar este mes en la planilla",
    ],
    audience: ["Empresas que prestan o adelantan salario", "Encargados de planilla y RR. HH."],
  },
});
