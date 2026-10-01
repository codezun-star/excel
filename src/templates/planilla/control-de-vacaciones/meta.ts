import { ALL_EMPLOYERS } from "@/templates/categories";
import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "control-de-vacaciones",
  title: "Control de vacaciones",
  shortDescription:
    "Días de vacaciones ganados según la antigüedad de cada empleado, días tomados, saldo pendiente y próximo período.",
  category: "planilla",
  businessTypes: ALL_EMPLOYERS,
  countries: ["HN"],
  tier: "pro",
  regulated: "laboral",
  details: {
    includes: [
      "Años de servicio y días ganados acumulados según la escala legal",
      "Registro de vacaciones tomadas por empleado",
      "Saldo de días pendientes con alertas",
      "Fecha del próximo aniversario y días que ganará",
    ],
    audience: ["Recursos humanos", "Pequeñas empresas con personal permanente"],
  },
});
