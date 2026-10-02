import { defineMeta } from "@/templates/define";

export const meta = defineMeta({
  slug: "control-de-remesas",
  title: "Control de remesas",
  shortDescription:
    "Registra las remesas recibidas en dólares, el tipo de cambio, las comisiones, lo recibido en lempiras y en qué se usó cada envío.",
  category: "finanzas-personales",
  businessTypes: ["hogar"],
  tier: "free",
  featured: true,
  seo: {
    title: "Control de remesas en Excel gratis (dólares a lempiras) | Excel Codezun",
    description:
      "Lleva el control de las remesas que recibe tu familia en Excel: dólares, tipo de cambio, comisiones, lempiras recibidos y usos por mes.",
    keywords: ["control de remesas excel", "remesas honduras", "registro de remesas familiares"],
  },
  details: {
    includes: [
      "Remesas por fecha, remitente y empresa de envío",
      "Conversión a lempiras con tipo de cambio y comisión",
      "Uso de cada remesa (alimentación, educación, vivienda, ahorro…)",
      "Resumen por mes y por uso",
    ],
    audience: [
      "Familias que reciben remesas",
      "Migrantes que envían dinero y quieren dar seguimiento",
    ],
  },
});
