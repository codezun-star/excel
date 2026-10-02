import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "historial-de-consultas",
  title: "Historial de consultas",
  shortDescription:
    "Expediente sencillo: datos del paciente, alergias y antecedentes, consultas con signos vitales e IMC, diagnóstico, tratamiento, próximo control y ficha por paciente.",
  category: "salud",
  businessTypes: ["clinica"],
  tier: "free",
  seo: {
    title: "Historial clínico de pacientes en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis de historial de consultas: antecedentes, signos vitales, IMC, diagnóstico, tratamiento, próximos controles y ficha del paciente.",
    keywords: [
      "historial clínico excel",
      "expediente de pacientes excel",
      "registro de consultas médicas",
      "ficha médica del paciente",
    ],
  },
  details: {
    includes: [
      "Pacientes con edad, tipo de sangre, alergias y enfermedades crónicas",
      "Consultas con presión, pulso, temperatura, peso, talla e IMC",
      "Diagnóstico, tratamiento y fecha del próximo control",
      "Ficha del paciente con sus consultas más recientes primero",
      "Controles programados para los próximos 7 días",
    ],
    audience: [
      "Médicos generales y especialistas",
      "Enfermería, nutrición, fisioterapia y brigadas médicas",
    ],
  },
});
