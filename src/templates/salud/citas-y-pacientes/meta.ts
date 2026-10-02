import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "citas-y-pacientes",
  title: "Citas y pacientes",
  shortDescription:
    "Registro de pacientes con edad automática, agenda de citas con estado y cobro, agenda del día para imprimir, inasistencias e ingresos por mes y por profesional.",
  category: "salud",
  businessTypes: ["clinica"],
  tier: "free",
  seo: {
    title: "Agenda de citas y pacientes en Excel gratis para clínicas | Excel Codezun",
    description:
      "Plantilla gratis para consultorios, clínicas dentales, fisioterapia y psicología: pacientes, citas, agenda del día, cobros e inasistencias.",
    keywords: [
      "agenda de citas excel",
      "control de pacientes excel",
      "agenda de consultorio",
      "citas clínica dental excel",
    ],
  },
  details: {
    includes: [
      "Pacientes con código, edad calculada y datos de contacto",
      "Citas con hora, motivo, profesional, estado, precio, pago y saldo",
      "Agenda del día: elige la fecha y ve las citas para imprimir",
      "Resumen mensual de citas, atendidas, inasistencias e ingresos",
      "Citas e ingresos por profesional",
    ],
    audience: [
      "Consultorios médicos y clínicas dentales",
      "Fisioterapia, psicología, nutrición, estética y veterinarias",
    ],
  },
});
