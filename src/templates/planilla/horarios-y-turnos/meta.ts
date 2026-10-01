import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "horarios-y-turnos",
  title: "Horarios y turnos",
  shortDescription:
    "Horario semanal por empleado con entrada y salida por día, horas trabajadas y alerta si se excede la jornada semanal legal.",
  category: "planilla",
  businessTypes: ["restaurante", "comercio", "farmacia", "clinica", "cafeteria-panaderia"],
  tier: "free",
  details: {
    includes: [
      "Entrada y salida por día de la semana (soporta turnos nocturnos)",
      "Horas netas por semana descontando el descanso",
      "Comparación con el máximo semanal de la jornada (diurna, nocturna o mixta)",
    ],
    audience: ["Restaurantes, farmacias y comercios con turnos", "Supervisores"],
  },
});
