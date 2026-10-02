import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "medicamentos-y-vencimientos",
  title: "Medicamentos y vencimientos",
  shortDescription:
    "Medicamentos por persona con dosis, horarios que se calculan solos, existencias, días que alcanzan, fechas de vencimiento con alertas, registro de tomas y gasto en compras.",
  category: "salud",
  businessTypes: ["clinica", "farmacia", "hogar"],
  tier: "free",
  seo: {
    title: "Control de medicamentos y vencimientos en Excel gratis | Excel Codezun",
    description:
      "Plantilla gratis para controlar medicamentos en casa o en el consultorio: horarios, existencias, cuándo comprar, vencimientos y gasto mensual.",
    keywords: [
      "control de medicamentos excel",
      "horario de medicamentos",
      "control de vencimiento de medicamentos",
      "botiquín control excel",
    ],
  },
  details: {
    includes: [
      "Medicamentos por persona con dosis, cada cuántas horas y horarios automáticos",
      "Existencias, días que alcanzan y fecha en que se terminan",
      "Alertas de vencidos, por vencer y por comprar",
      "Registro de tomas y de compras con gasto por mes",
    ],
    audience: [
      "Familias que cuidan a adultos mayores o pacientes crónicos",
      "Consultorios, asilos y botiquines de empresas",
    ],
  },
});
