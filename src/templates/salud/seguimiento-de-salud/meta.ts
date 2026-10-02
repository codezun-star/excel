import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "seguimiento-de-salud",
  title: "Seguimiento de salud",
  shortDescription:
    "Registro de presión arterial, pulso, glucosa y peso por persona con clasificación automática, IMC, alertas, promedios de 30 días y evolución mes a mes.",
  category: "salud",
  businessTypes: ["hogar", "clinica"],
  tier: "free",
  seo: {
    title: "Control de presión arterial y glucosa en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para registrar presión, glucosa, pulso y peso con clasificación automática, IMC, alertas y promedios para llevar al médico.",
    keywords: [
      "control de presión arterial excel",
      "registro de glucosa excel",
      "control de diabetes e hipertensión",
      "tabla de presión arterial",
    ],
  },
  details: {
    includes: [
      "Mediciones de presión, pulso, glucosa (en ayunas o después de comer) y peso",
      "Clasificación automática de presión, glucosa e IMC con rangos editables",
      "Alertas en rojo para valores altos o muy bajos",
      "Promedios de los últimos 30 días por persona y evolución por mes",
    ],
    audience: [
      "Personas con hipertensión, diabetes o sobrepeso y sus familias",
      "Promotores de salud y cuidadores",
    ],
  },
});
